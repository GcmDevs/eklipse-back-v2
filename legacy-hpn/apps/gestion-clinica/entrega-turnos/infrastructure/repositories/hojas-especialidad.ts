import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { IngresoOrm } from '@orm/gen';
import { EspecialidadOrm, MedicoOrm } from '@orm/gen/medicos';
import {
  EntregaTurnoOrm,
  HojaEspecialidadOrm,
  HojaEspecialidadVersionOrm,
  PacienteTemporalOrm,
} from '@orm/gcn';
import { EstanciaOrm } from '@orm/temp';
import { EntityManager } from 'typeorm';
import { EN_PROCESO } from '../../application/types';
import { permisosHojaEspecialidad } from '../../application/hojas-especialidad-policy';
import { GuardarHojaEspecialidadDto } from '../../presentation/dtos/hojas-especialidad';

@Injectable()
export class HojasEspecialidadImpl extends BaseSource {
  public async catalogo(ingresoId: number) {
    const ingreso = await this.conn.getRepository(IngresoOrm).findOne({ where: { id: ingresoId } });
    if (!ingreso) throw new NotFoundException('El ingreso no existe.');
    return this.especialidadesDelIngreso(ingresoId, this.conn.manager);
  }

  private async especialidadesDelIngreso(
    ingresoId: number,
    manager: EntityManager
  ): Promise<{ id: number; codigo: string; nombre: string }[]> {
    // Las mismas interconsultas del ingreso que alimentan las especialidades del listado.
    return manager.query(
      `SELECT DISTINCT E.OID AS id, E.GEECODIGO AS codigo, E.GEEDESCRI AS nombre
       FROM HCNINTERC I
       INNER JOIN HCNFOLIO F ON F.OID = I.HCNFOLIO
       INNER JOIN GENESPECI E ON E.OID = I.GENESPECI
       WHERE F.ADNINGRESO = @0
       ORDER BY E.GEEDESCRI, E.GEECODIGO, E.OID`,
      [ingresoId]
    );
  }

  private async contexto(ingresoId: number, manager: EntityManager = this.conn.manager) {
    const ingreso = await manager.getRepository(IngresoOrm).findOne({ where: { id: ingresoId } });
    if (!ingreso) throw new NotFoundException('El ingreso no existe.');
    // La última estancia es la fuente de ubicación: no aceptar centro/subgrupo del cliente.
    const estancia = await manager.getRepository(EstanciaOrm).findOne({
      where: { ingresoId },
      relations: ['cama', 'cama.grupo', 'cama.subgrupo'],
      order: { id: 'DESC' },
    });
    const hospitalizado = !ingreso.fechaEgreso && !!estancia && !estancia.fechaEgreso;
    let equipoTurno = false;
    if (hospitalizado) {
      let subgrupoId = estancia.cama.subGrupoId;
      const centroId = Number(estancia.cama.centroId);
      const esTemporal = [estancia.cama.grupo?.nombre, estancia.cama.subgrupo?.nombre].some(
        nombre => nombre?.toUpperCase().includes('TEMPORAL')
      );
      if (esTemporal) {
        const asignacion = await manager.getRepository(PacienteTemporalOrm).findOne({
          where: { estanciaId: estancia.id, ingresoId, centroId },
          order: { id: 'DESC' },
        });
        if (asignacion) subgrupoId = asignacion.subgrupoDestinoId;
      }
      const turno = await manager.getRepository(EntregaTurnoOrm).findOne({
        where: { centroAtencionId: centroId, subgrupoId, isActivo: true },
        relations: ['cambiosTurno'],
        order: { id: 'DESC' },
      });
      equipoTurno =
        !!turno &&
        turno.estadoCode === EN_PROCESO.getCode() &&
        !turno.fechaEntrega &&
        (turno.medicoEntregaTurnoId === this.auth.id ||
          turno.cambiosTurno.some(c => c.tipo === 2 && c.medicoId === this.auth.id));
    }
    const medicos = await manager
      .getRepository(MedicoOrm)
      .find({ where: { usuarioId: this.auth.id } });
    return {
      hospitalizado,
      equipoTurno,
      especialidades: new Set(medicos.map(m => m.especialidadId)),
    };
  }

  private respuesta(
    hoja: HojaEspecialidadOrm,
    contexto: Awaited<ReturnType<HojasEspecialidadImpl['contexto']>>
  ) {
    return {
      id: hoja.id,
      ingresoId: hoja.ingresoId,
      especialidad: {
        id: hoja.especialidadId,
        codigo: hoja.especialidad.codigo,
        nombre: hoja.especialidad.nombre,
      },
      contenido: hoja.contenido,
      activa: hoja.activa,
      version: hoja.version,
      fechaCreacion: hoja.fechaCreacion,
      fechaModificacion: hoja.fechaModificacion,
      ultimoAutor: hoja.ultimoAutor
        ? { id: hoja.ultimoAutor.id, nombre: hoja.ultimoAutor.nombreCompleto }
        : null,
      ...permisosHojaEspecialidad(
        contexto.hospitalizado,
        contexto.equipoTurno,
        contexto.especialidades.has(hoja.especialidadId),
        hoja.activa
      ),
    };
  }

  public async listar(ingresoId: number) {
    const contexto = await this.contexto(ingresoId);
    const hojas = await this.conn.getRepository(HojaEspecialidadOrm).find({
      where: { ingresoId },
      relations: ['especialidad', 'ultimoAutor'],
      order: { especialidad: { nombre: 'ASC' } },
    });
    return {
      puedeAdministrar: contexto.hospitalizado && contexto.equipoTurno,
      hojas: hojas.map(hoja => this.respuesta(hoja, contexto)),
    };
  }

  public async agregar(ingresoId: number, especialidadId: number) {
    try {
      await this.conn.transaction(async manager => {
        const contexto = await this.contexto(ingresoId, manager);
        if (!contexto.equipoTurno)
          throw new ForbiddenException('Solo el equipo del turno abierto puede administrar hojas.');
        const especialidad = await manager
          .getRepository(EspecialidadOrm)
          .findOne({ where: { id: especialidadId } });
        if (!especialidad) throw new NotFoundException('La especialidad no existe.');
        const disponibles = await this.especialidadesDelIngreso(ingresoId, manager);
        if (!disponibles.some(e => e.id === especialidadId))
          throw new BadRequestException(
            'La especialidad no está disponible en las interconsultas de este ingreso. No se puede agregar ni reactivar su hoja.'
          );
        const rp = manager.getRepository(HojaEspecialidadOrm);
        const existente = await rp.findOne({
          where: { ingresoId, especialidadId },
          lock: { mode: 'pessimistic_write' },
        });
        if (existente) {
          if (!existente.activa) {
            existente.activa = true;
            await rp.save(existente);
          }
        } else {
          await rp.save(
            rp.create({
              ingresoId,
              especialidadId,
              contenido: '',
              activa: true,
              version: 0,
              creadoPorId: this.auth.id,
              fechaCreacion: new Date(),
              modificadoPorId: null,
              fechaModificacion: null,
            })
          );
        }
      });
    } catch (error) {
      // SQL Server garantiza la unicidad incluso ante dos altas simultáneas.
      if ([2601, 2627].includes(error?.number ?? error?.driverError?.number)) {
        throw new ConflictException('La hoja ya fue agregada. Actualice el listado.');
      }
      throw error;
    }
    return this.listar(ingresoId);
  }

  private async buscar(
    manager: EntityManager,
    ingresoId: number,
    hojaId: number,
    bloquear = false
  ) {
    const hoja = await manager.getRepository(HojaEspecialidadOrm).findOne({
      where: { id: hojaId, ingresoId },
      ...(bloquear ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });
    if (!hoja) throw new NotFoundException('La hoja no pertenece al ingreso seleccionado.');
    return hoja;
  }

  public async archivar(ingresoId: number, hojaId: number) {
    await this.conn.transaction(async manager => {
      const hoja = await this.buscar(manager, ingresoId, hojaId, true);
      const contexto = await this.contexto(ingresoId, manager);
      if (!contexto.equipoTurno)
        throw new ForbiddenException('Solo el equipo del turno abierto puede administrar hojas.');
      hoja.activa = false;
      await manager.getRepository(HojaEspecialidadOrm).save(hoja);
    });
    return this.listar(ingresoId);
  }

  public async guardar(ingresoId: number, hojaId: number, body: GuardarHojaEspecialidadDto) {
    return this.conn.transaction(async manager => {
      const hoja = await this.buscar(manager, ingresoId, hojaId, true);
      const contexto = await this.contexto(ingresoId, manager);
      const permisos = permisosHojaEspecialidad(
        contexto.hospitalizado,
        contexto.equipoTurno,
        contexto.especialidades.has(hoja.especialidadId),
        hoja.activa
      );
      if (!permisos.puedeEditar)
        throw new ForbiddenException('No puede editar esta hoja o el paciente ya egresó.');
      if (hoja.version !== body.version)
        throw new ConflictException({
          message:
            'Otro médico modificó esta hoja. Revise la versión vigente antes de volver a guardar.',
          versionActual: hoja.version,
        });
      if (hoja.contenido !== body.contenido) {
        hoja.contenido = body.contenido;
        hoja.version += 1;
        hoja.modificadoPorId = this.auth.id;
        hoja.fechaModificacion = new Date();
        await manager.getRepository(HojaEspecialidadOrm).save(hoja);
        const versiones = manager.getRepository(HojaEspecialidadVersionOrm);
        await versiones.save(
          versiones.create({
            hojaId: hoja.id,
            version: hoja.version,
            contenido: hoja.contenido,
            usuarioId: this.auth.id,
            fecha: hoja.fechaModificacion,
          })
        );
      }
      const guardada = await manager.getRepository(HojaEspecialidadOrm).findOne({
        where: { id: hoja.id },
        relations: ['especialidad', 'ultimoAutor'],
      });
      return this.respuesta(guardada, contexto);
    });
  }

  public async historial(ingresoId: number, hojaId: number) {
    await this.contexto(ingresoId);
    await this.buscar(this.conn.manager, ingresoId, hojaId);
    const versiones = await this.conn.getRepository(HojaEspecialidadVersionOrm).find({
      where: { hojaId },
      relations: ['autor'],
      order: { version: 'DESC' },
    });
    return versiones.map(v => ({
      id: v.id,
      version: v.version,
      contenido: v.contenido,
      fecha: v.fecha,
      autor: { id: v.usuarioId, nombre: v.autor?.nombreCompleto ?? '' },
    }));
  }
}
