import { BadRequestException, Injectable } from '@nestjs/common';
import { TABLE_NAMES } from '@common/application/constants';
import {
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoTramoOrm,
  TrasladoEstadoHistorialOrm,
  TrasladoSignosVitalesOrm,
  TrasladoNotaOrm,
  ProcedimientoOrm,
  MedicamentoOrm,
  MedicamentoPrevioOrm,
  VehiculoOrm,
  EkEmpleadoOrm,
  TrasladoRevisionCentralOrm,
  TrasladoAccidenteOrm,
  TrasladoVehiculoInvolucradoOrm,
  ProcedimientoTempOrm,
} from '@hpn/lgc/tas/orm/gcn';
import {
  ASISTENCIA_TIPOS,
  CANCELADO,
  ESTADOS_ASISTENCIA,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import {
  CreateTrasladoPrimarioDto,
  CreateTrasladoSecundarioDto,
  IniciarTrasladoDto,
} from '@hpn/lgc/tas/presentation/dtos';
import { Between, Brackets, In, Not } from 'typeorm';
import { newDataToTrasladoDetalle, newDataToTraslados } from '../factories';
import { deleteFile } from '@common/presentation/helpers';
import {
  ALL_CONTEXTS_WITH_AUTHORITIES,
  GCM_CONTEXTS,
  GcmContextCode,
  gcmContextFactory,
  GcmContextType,
} from '@common/domain/types';
import { RecursosCompartidosSource } from '../services';
import { FolioOrm, UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { DiagnosticoOrm, EstanciaOrm } from '@hpn/lgc/tas/orm/temp';
import { DiagPacienteOrm } from '@hpn/lgc/tas/orm/hcn';
import { TDiagnosticoRes } from '../../application/responses';
import { LGC_TAS_LOCATIONS } from '../../application/constants';

@Injectable()
export class TrasladoCrudSource extends RecursosCompartidosSource {
  public async fetchSolicitudesByRangoFechas(
    inicio: Date,
    final: Date,
    onlyMisSolicitudes: boolean,
    contextoCode?: GcmContextCode
  ): Promise<any> {
    const contexto = contextoCode ? gcmContextFactory(contextoCode) : this.auth.context;

    const qr = this.dynamicConn(contexto);

    const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);

    const now = new Date();
    const isToday =
      inicio.getFullYear() === now.getFullYear() &&
      inicio.getMonth() === now.getMonth() &&
      inicio.getDate() === now.getDate() &&
      final.getFullYear() === now.getFullYear() &&
      final.getMonth() === now.getMonth() &&
      final.getDate() === now.getDate();

    let where: any;

    if (isToday) {
      const excludedStates = [
        ESTADOS_ASISTENCIA.APROBADO.getCode(),
        ESTADOS_ASISTENCIA.CANCELADO.getCode(),
        ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
      ];
      where = [{ fechaCreacion: Between(inicio, final) }, { estadoCode: Not(In(excludedStates)) }];
    } else {
      where = { fechaCreacion: Between(inicio, final) };
    }
    const traslados = await this.buildTrasladoQuery(trasladoRp)
      .andWhere(where)
      .orderBy('t.id', 'DESC')
      .getMany();

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

    await ekQr.connect();
    try {
      const vehiculoIds = this.uniqueNumbers(
        traslados.flatMap(
          traslado => traslado.asignaciones?.map(asignacion => asignacion.vehiculoId) ?? []
        )
      );

      const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
      const vehiculos = vehiculoIds.length
        ? await vehiculoRp.find({ where: { id: In(vehiculoIds) } })
        : [];
      const vehiculoMap = new Map(vehiculos.map(vehiculo => [vehiculo.id, vehiculo]));

      return newDataToTraslados(traslados, vehiculoMap, contexto);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    } finally {
      await ekQr.release();
    }
  }

  public async findTrasladoById(id: number, contextoCode?: GcmContextCode): Promise<any> {
    const contexto = contextoCode ? gcmContextFactory(contextoCode) : this.auth.context;

    const qr = this.dynamicConn(contexto);
    const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);
    const traslados = await this.buildTrasladoQuery(trasladoRp)
      .where('t.id = :id', { id })
      .getOne();
    return newDataToTraslados([traslados], undefined, contexto)[0];
  }

  public async fetchSolicitudesCountByCentro(inicio: Date, final: Date): Promise<any> {
    const now = new Date();
    const isToday =
      inicio.getFullYear() === now.getFullYear() &&
      inicio.getMonth() === now.getMonth() &&
      inicio.getDate() === now.getDate() &&
      final.getFullYear() === now.getFullYear() &&
      final.getMonth() === now.getMonth() &&
      final.getDate() === now.getDate();

    const ctx = ALL_CONTEXTS_WITH_AUTHORITIES;

    const resultsPromises = ctx.map(async context => {
      const ekQr = this.dynamicQR(context);
      await ekQr.connect();
      try {
        const trasladoRp = ekQr.manager.getRepository(TrasladoAsistencialOrm);

        const qb = trasladoRp
          .createQueryBuilder('t')
          .select('COUNT(t.id)', 'total')
          .addSelect('SUM(CASE WHEN t.estadoCode = 1 THEN 1 ELSE 0 END)', 'solicitados')
          .addSelect('SUM(CASE WHEN t.estadoCode IN (2, 11) THEN 1 ELSE 0 END)', 'asignadas')
          .addSelect('SUM(CASE WHEN t.estadoCode IN (3) THEN 1 ELSE 0 END)', 'entregados')
          .addSelect('SUM(CASE WHEN t.estadoCode IN (4) THEN 1 ELSE 0 END)', 'recibidos')
          .addSelect('SUM(CASE WHEN t.estadoCode IN (5, 14) THEN 1 ELSE 0 END)', 'enRuta')
          .addSelect('SUM(CASE WHEN t.estadoCode = 6 THEN 1 ELSE 0 END)', 'finalizadas');

        if (isToday) {
          const excludedStates = [
            ESTADOS_ASISTENCIA.APROBADO.getCode(),
            ESTADOS_ASISTENCIA.CANCELADO.getCode(),
          ];

          qb.andWhere(
            new Brackets(xq => {
              xq.where('t.fechaCreacion BETWEEN :inicio AND :final', { inicio, final }).orWhere(
                't.estadoCode NOT IN (:...excludedStates)',
                { excludedStates }
              );
            })
          );
        } else {
          qb.andWhere('t.fechaCreacion BETWEEN :inicio AND :final', { inicio, final });
        }

        qb.andWhere('t.ISDELETE = 0');

        const raw = await qb.getRawOne();

        return {
          contextoCode: context.getCode(),
          total: Number(raw?.total || 0),
          solicitados: Number(raw?.solicitados || 0),
          asignadas: Number(raw?.asignadas || 0),
          entregados: Number(raw?.entregados || 0),
          recibidos: Number(raw?.recibidos || 0),
          enRuta: Number(raw?.enRuta || 0),
          finalizadas: Number(raw?.finalizadas || 0),
        };
      } catch (error: any) {
        throw new Error(error.message);
      } finally {
        await ekQr.release();
      }
    });

    const responses = await Promise.all(resultsPromises);

    const solicitudesByCentro = responses.filter(Boolean);

    const global = solicitudesByCentro.reduce(
      (acc, curr) => {
        acc.total += curr.total;
        acc.solicitados += curr.solicitados;
        acc.asignadas += curr.asignadas;
        acc.entregados += curr.entregados;
        acc.recibidos += curr.recibidos;
        acc.enRuta += curr.enRuta;
        acc.finalizadas += curr.finalizadas;
        return acc;
      },
      {
        contextoCode: 'GLOBAL',
        total: 0,
        solicitados: 0,
        asignadas: 0,
        entregados: 0,
        recibidos: 0,
        enRuta: 0,
        finalizadas: 0,
      }
    );

    return {
      solicitudesByCentro,
      global,
    };
  }

  public async fetchTrasladoById(trasladoId: number, contextoCode?: GcmContextCode): Promise<any> {
    const contexto = contextoCode ? gcmContextFactory(contextoCode) : this.auth.context;
    const connLocal = contextoCode ? this.dynamicConn(contexto) : this.conn;

    const trasladoRp = connLocal.getRepository(TrasladoAsistencialOrm);
    const revisionRp = connLocal.getRepository(TrasladoRevisionCentralOrm);
    try {
      // Do not join every one-to-many relation in the same query. A traslado with
      // several tramos, signs, notes, procedures and medications produces a
      // cartesian multiplication of rows that TypeORM must hydrate afterwards.
      const traslado = await this.buildTrasladoDetailBaseQuery(trasladoRp)
        .leftJoinAndSelect('t.diagnostico', 'diagnostico')
        .leftJoinAndSelect('t.diagSecundario', 'diagSecundario')
        .leftJoinAndSelect('paciente.direccion', 'direccionDetalle')
        .leftJoinAndSelect('paciente.telefono', 'telefonoDetalle')
        .andWhere({ id: trasladoId })
        .getOne();

      if (!traslado) {
        throw new Error(`No existe traslado con id ${trasladoId}o se encuentra eliminado`);
      }

      traslado.accidente = await connLocal.getRepository(TrasladoAccidenteOrm).findOne({
        where: { trasladoId },
      });
      if (traslado.accidente) {
        traslado.accidente.vehiculos = await connLocal
          .getRepository(TrasladoVehiculoInvolucradoOrm)
          .find({
            where: { accidenteId: traslado.accidente.id },
            order: { id: 'ASC' },
          });
      }
      const asignacionRp = connLocal.getRepository(TrasladoAsignacionOrm);
      const historialRp = connLocal.getRepository(TrasladoEstadoHistorialOrm);
      const signosVitalesRp = connLocal.getRepository(TrasladoSignosVitalesOrm);
      const notasRp = connLocal.getRepository(TrasladoNotaOrm);
      const procedimientosRp = connLocal.getRepository(ProcedimientoOrm);
      const medicamentosRp = connLocal.getRepository(MedicamentoOrm);
      const medicamentosPreviosRp = connLocal.getRepository(MedicamentoPrevioOrm);

      const [
        asignaciones,
        estadosHistorial,
        signosVitales,
        notas,
        procedimientos,
        medicamentos,
        medicamentosPrevios,
        revisionesCentral,
      ] = await Promise.all([
        asignacionRp.find({ where: { trasladoId } }),
        historialRp.find({ where: { trasladoId } }),
        signosVitalesRp
          .createQueryBuilder('signosVitales')
          .leftJoinAndSelect('signosVitales.usuario', 'usuarioSignosVitales')
          .where('signosVitales.trasladoId = :trasladoId', { trasladoId })
          .getMany(),
        notasRp
          .createQueryBuilder('notas')
          .leftJoinAndSelect('notas.usuario', 'usuarioNotas')
          .where('notas.trasladoId = :trasladoId', { trasladoId })
          .getMany(),
        procedimientosRp
          .createQueryBuilder('procedimientos')
          .leftJoinAndSelect('procedimientos.procedimiento', 'procedimiento')
          .where('procedimientos.trasladoId = :trasladoId', { trasladoId })
          .getMany(),
        medicamentosRp
          .createQueryBuilder('medicamentos')
          .leftJoinAndSelect('medicamentos.medicamento', 'medicamento')
          .leftJoinAndSelect('medicamentos.usuario', 'usuarioMedicamentos')
          .where('medicamentos.trasladoId = :trasladoId', { trasladoId })
          .getMany(),
        medicamentosPreviosRp
          .createQueryBuilder('medicamentoPrevio')
          .leftJoinAndSelect('medicamentoPrevio.medicamento', 'productoMedicamentoPrevio')
          .where('medicamentoPrevio.TRASLADO = :trasladoId', { trasladoId })
          .orderBy('medicamentoPrevio.id', 'ASC')
          .getMany(),
        revisionRp.find({ where: { trasladoId } }),
      ]);

      const tramosById = new Map((traslado.tramos ?? []).map(tramo => [tramo.id, tramo]));
      for (const tramo of tramosById.values()) {
        tramo.signosVitales = [];
        tramo.notas = [];
        tramo.procedimientos = [];
        tramo.medicamentos = [];
      }
      signosVitales.forEach(signo => tramosById.get(signo.tramoId)?.signosVitales.push(signo));
      notas.forEach(nota => tramosById.get(nota.tramoId)?.notas.push(nota));
      procedimientos.forEach(procedimiento =>
        tramosById.get(procedimiento.tramoId)?.procedimientos.push(procedimiento)
      );
      medicamentos.forEach(medicamento =>
        tramosById.get(medicamento.tramoId)?.medicamentos.push(medicamento)
      );

      traslado.asignaciones = asignaciones;
      traslado.estadosHistorial = estadosHistorial;
      traslado.revisionesCentral = revisionesCentral;
      traslado.medicamentosPrevios = medicamentosPrevios;
      traslado.signosVitales = signosVitales.filter(item => !tramosById.has(item.tramoId));
      traslado.notas = notas.filter(item => !tramosById.has(item.tramoId));
      traslado.procedimientos = procedimientos.filter(item => !tramosById.has(item.tramoId));
      traslado.medicamentos = medicamentos.filter(item => !tramosById.has(item.tramoId));

      if (traslado.pacienteId && traslado.paciente) {
        const estanciaRp = connLocal.getRepository(EstanciaOrm);

        const estancia = await estanciaRp.findOne({
          where: {
            //fechaEgreso: IsNull(),
            ingreso: { paciente: { id: traslado.pacienteId } },
          },
          order: {
            id: 'DESC',
          },
          relations: ['cama', 'cama.grupo', 'cama.subgrupo'],
        });

        traslado.paciente.estancia = estancia;

        if (estancia) {
          const diagnosticos = await this.getDignosticos(estancia.ingresoId, contexto);

          traslado.paciente.diagnosticos = diagnosticos;
        }
      }

      const userIdsByContexto = new Map<number, number[]>();

      const registrosConAutor = [...signosVitales, ...notas, ...procedimientos, ...medicamentos];
      for (const registro of registrosConAutor) {
        const ctx = registro.centroProcesamiento || contexto.getNumericCode();
        const ids = userIdsByContexto.get(ctx) ?? [];
        ids.push(registro.usuarioId);
        userIdsByContexto.set(ctx, ids);
      }
      for (const revision of revisionesCentral) {
        const ctx = revision.centroProcesamiento || contexto.getNumericCode();
        const ids = userIdsByContexto.get(ctx) ?? [];
        ids.push(revision.usuarioCentralId);
        userIdsByContexto.set(ctx, ids);
      }

      for (const h of traslado.estadosHistorial ?? []) {
        const ctx = h.centroProcesamiento || contexto.getNumericCode();
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(h.usuarioId);
      }

      for (const a of traslado.asignaciones ?? []) {
        const ctx = a.centroProcesamiento || contexto.getNumericCode();
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(a.asignadoPorId);
      }

      const usuariosPorContexto = new Map<number, Map<number, UsuarioOrm>>();

      await Promise.all(
        Array.from(userIdsByContexto.entries()).map(async ([contexto, ids]) => {
          const ctx = ALL_CONTEXTS_WITH_AUTHORITIES.find(
            item => item.getNumericCode() === contexto
          );
          const usuarios = ctx
            ? await this.dynamicConn(ctx)
                .getRepository(UsuarioOrm)
                .find({
                  where: { id: In(this.uniqueNumbers(ids)) },
                })
            : [];
          usuariosPorContexto.set(contexto, new Map(usuarios.map(u => [u.id, u])));
        })
      );

      traslado.estadosHistorial?.forEach(h => {
        h.usuario =
          usuariosPorContexto
            .get(h.centroProcesamiento || contexto.getNumericCode())
            ?.get(h.usuarioId) ?? null;
      });

      for (const registro of registrosConAutor) {
        registro['usuario'] =
          usuariosPorContexto
            .get(registro.centroProcesamiento || contexto.getNumericCode())
            ?.get(registro.usuarioId) ?? null;
      }
      for (const revision of revisionesCentral) {
        revision.usuarioCentral =
          usuariosPorContexto
            .get(revision.centroProcesamiento || contexto.getNumericCode())
            ?.get(revision.usuarioCentralId) ?? null;
      }

      traslado.asignaciones?.forEach(a => {
        a.asignadoPor =
          usuariosPorContexto
            .get(a.centroProcesamiento || contexto.getNumericCode())
            ?.get(a.asignadoPorId) ?? null;
      });

      traslado.tramos = (traslado.tramos ?? []).sort((a, b) => a.orden - b.orden || a.id - b.id);

      traslado.asignaciones = traslado.asignaciones?.sort((a, b) => b.id - a.id);

      traslado.estadosHistorial = traslado.estadosHistorial?.sort((a, b) => b.id - a.id);

      const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

      try {
        await ekQr.connect();

        const vehiculoIds = this.uniqueNumbers(
          traslado.asignaciones?.map(asignacion => asignacion.vehiculoId) ?? []
        );
        const empleadoIds = this.uniqueNumbers(
          traslado.asignaciones?.flatMap(asignacion => [
            asignacion.conductorId,
            asignacion.auxiliarId,
            asignacion.medicoId,
          ]) ?? []
        );

        const ekProcedimientoIds = this.uniqueNumbers(
          procedimientos.filter(proc => proc.ekprocedimientoId).map(proc => proc.ekprocedimientoId)
        );

        const autorDocumentos = this.uniqueStrings(
          traslado.tramos
            ?.flatMap(tramo => [
              ...(tramo.notas?.map(nota => nota.usuario?.cedula?.trim()) ?? []),
              ...(tramo.signosVitales?.map(sv => sv.usuario?.cedula?.trim()) ?? []),
            ])
            .filter(Boolean) ?? []
        );

        const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
        const empleadoRp = ekQr.manager.getRepository(EkEmpleadoOrm);
        const procedimientoTempRp = ekQr.manager.getRepository(ProcedimientoTempOrm);

        const [vehiculos, empleados, empleadosPorDoc, procedimientosTemp] = await Promise.all([
          vehiculoIds.length
            ? vehiculoRp.find({ where: { id: In(vehiculoIds) } })
            : Promise.resolve([]),
          empleadoIds.length
            ? empleadoRp.find({ where: { id: In(empleadoIds) } })
            : Promise.resolve([]),
          autorDocumentos.length
            ? empleadoRp.find({ where: { documento: In(autorDocumentos) } })
            : Promise.resolve([]),
          ekProcedimientoIds.length
            ? procedimientoTempRp.find({ where: { id: In(ekProcedimientoIds) } })
            : Promise.resolve([]),
        ]);

        const vehiculoMap = new Map(vehiculos.map(vehiculo => [vehiculo.id, vehiculo]));
        const empleadoMap = new Map(empleados.map(empleado => [empleado.id, empleado]));
        const authorMap = new Map(empleadosPorDoc.map(e => [e.documento?.trim(), e]));
        const procedimientoTempMap = new Map(procedimientosTemp.map(proc => [proc.id, proc]));

        const result = newDataToTrasladoDetalle(
          traslado,
          vehiculoMap,
          empleadoMap,
          authorMap,
          procedimientoTempMap
        );

        return result;
      } finally {
        await ekQr.release();
      }
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchAsignacionActualByTrasladoId(
    trasladoId: number,
    contextoCode?: GcmContextCode
  ): Promise<any> {
    const connLocal = contextoCode ? this.dynamicConn(gcmContextFactory(contextoCode)) : this.conn;

    const trasladoRp = connLocal.getRepository(TrasladoAsistencialOrm);

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

    await ekQr.connect();
    try {
      const traslado = await trasladoRp.findOne({
        where: { id: trasladoId, isDeleted: false },
        relations: ['asignaciones'],
        order: {
          asignaciones: { id: 'DESC' },
        },
      });

      if (!traslado) {
        throw new Error(`No existe traslado con id ${trasladoId} o se encuentra eliminado`);
      }

      const asignacionActual = this.getAsignacionActual(traslado.asignaciones);

      if (!asignacionActual) {
        return {
          trasladoId,
          asignacionActual: null,
        };
      }

      const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
      const empleadoRp = ekQr.manager.getRepository(EkEmpleadoOrm);

      const vehiculoIds = this.uniqueNumbers([asignacionActual.vehiculoId]);
      const empleadoIds = this.uniqueNumbers([
        asignacionActual.conductorId,
        asignacionActual.auxiliarId,
        asignacionActual.medicoId,
      ]);

      const [vehiculos, empleados] = await Promise.all([
        vehiculoIds.length
          ? vehiculoRp.find({ where: { id: In(vehiculoIds) } })
          : Promise.resolve([]),
        empleadoIds.length
          ? empleadoRp.find({ where: { id: In(empleadoIds) } })
          : Promise.resolve([]),
      ]);

      const vehiculoMap = new Map(vehiculos.map(vehiculo => [vehiculo.id, vehiculo]));
      const empleadoMap = new Map(empleados.map(empleado => [empleado.id, empleado]));
      const asignacion = this.enrichAsignacion(asignacionActual, vehiculoMap, empleadoMap);

      return {
        trasladoId,
        asignacionActual: asignacion,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    } finally {
      await ekQr.release();
    }
  }

  public async fetchTrasladosAsignadosUsuario(): Promise<any> {
    const authDocument = this.getAuthDocument();

    if (!authDocument) {
      throw new Error('No fue posible identificar el documento del usuario autenticado');
    }

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

    await ekQr.connect();

    try {
      const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
      const empleadoRp = ekQr.manager.getRepository(EkEmpleadoOrm);

      const empleado = await empleadoRp.findOne({
        where: { documento: authDocument },
      });

      if (!empleado) {
        throw new Error(`Empleado con documento ${authDocument} no encontrado`);
      }

      const items = new Map<
        string,
        {
          traslado: TrasladoAsistencialOrm;
          asignacion: TrasladoAsignacionOrm | null;
          contexto: GcmContextType;
        }
      >();
      const vehiculoIds = new Set<number>();

      for (const context of ALL_CONTEXTS_WITH_AUTHORITIES) {
        const qr = this.dynamicQR(context);

        await qr.connect();

        try {
          const asignacionRp = qr.manager.getRepository(TrasladoAsignacionOrm);
          const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);

          const asignaciones = await asignacionRp.find({
            where: [
              { conductorId: empleado.id, isActiva: true },
              { auxiliarId: empleado.id, isActiva: true },
              { medicoId: empleado.id, isActiva: true },
            ],
            order: {
              fechaAsignacion: 'DESC',
              id: 'DESC',
            },
          });

          const trasladoIds = this.uniqueNumbers(asignaciones.map(a => a.trasladoId));
          const trasladosAsignados = trasladoIds.length
            ? await this.buildTrasladoQuery(trasladoRp)
                .andWhere({ id: In(trasladoIds) })
                .andWhere('t.TIPO <> :tipoPrimario', {
                  tipoPrimario: ASISTENCIA_TIPOS.PRIMARIO.getCode(),
                })
                .andWhere({ estadoCode: Not(CANCELADO.getCode()) })
                .orderBy('t.id', 'DESC')
                .getMany()
            : [];

          const isCurrentContext = context.getCode() === this.auth.context.getCode();
          const primariosPropios = isCurrentContext
            ? await this.buildTrasladoQuery(trasladoRp)
                .andWhere('t.TIPO = :tipoPrimario', {
                  tipoPrimario: ASISTENCIA_TIPOS.PRIMARIO.getCode(),
                })
                .andWhere('t.GENUSUARIO = :usuarioId', { usuarioId: this.auth.id })
                .andWhere('t.ESTADO NOT IN (:...estadosCerrados)', {
                  estadosCerrados: [
                    ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
                    ESTADOS_ASISTENCIA.CANCELADO.getCode(),
                  ],
                })
                .orderBy('t.id', 'DESC')
                .getMany()
            : [];

          const trasladosMap = new Map<number, TrasladoAsistencialOrm>();
          [...trasladosAsignados, ...primariosPropios].forEach(traslado =>
            trasladosMap.set(traslado.id, traslado)
          );
          const traslados = [...trasladosMap.values()];

          const estanciaRp = qr.manager.getRepository(EstanciaOrm);

          await Promise.all(
            traslados
              .filter(t => t.pacienteId && t.paciente)
              .map(async t => {
                const estancia = await estanciaRp.findOne({
                  where: {
                    ingreso: { paciente: { id: t.pacienteId } },
                  },
                  order: {
                    id: 'DESC',
                  },
                  relations: ['cama', 'cama.grupo', 'cama.subgrupo'],
                });

                t.paciente.estancia = estancia;
              })
          );

          const asignacionesMap = new Map<number, TrasladoAsignacionOrm>();
          asignaciones.forEach(asignacion => {
            if (!asignacionesMap.has(asignacion.trasladoId)) {
              asignacionesMap.set(asignacion.trasladoId, asignacion);
            }
            vehiculoIds.add(asignacion.vehiculoId);
          });

          traslados.forEach(traslado => {
            const key = `${context.getAbbreviation()}-${traslado.id}`;
            const asignacion = asignacionesMap.get(traslado.id) ?? null;
            items.set(key, {
              traslado: Object.assign(traslado, { contexto: context }),
              asignacion: asignacion ? Object.assign(asignacion, { contexto: context }) : null,
              contexto: context,
            });
          });
        } finally {
          await qr.release();
        }
      }

      if (!items.size) {
        return {
          usuario: {
            id: empleado.id,
            nombre: empleado.nombre,
            cedula: empleado.documento,
          },
          traslados: [],
        };
      }

      const vehiculos = vehiculoIds.size
        ? await vehiculoRp.find({ where: { id: In([...vehiculoIds]) } })
        : [];

      const vehiculoMap = new Map(vehiculos.map(v => [v.id, v]));

      const trasladosBase = newDataToTraslados(
        [...items.values()].map(item => item.traslado),
        vehiculoMap,
        undefined,
        true
      );

      const trasladoBaseMap = new Map(
        trasladosBase.map(t => [`${t.contexto.getAbbreviation()}-${t.id}`, t])
      );

      return {
        usuario: {
          id: empleado.id,
          nombre: empleado.nombre,
          cedula: empleado.documento,
        },
        traslados: [...items.entries()]
          .map(([key, item]) => {
            const trasladoBase = trasladoBaseMap.get(key);

            if (!trasladoBase) {
              return null;
            }

            const asignacion = item.asignacion;
            const tramoActivo = trasladoBase.tramos?.find(tramo => tramo.isActivo);
            return {
              ...trasladoBase,
              contextoCode: item.contexto.getCode(),
              tramoId: asignacion?.tramoId ?? tramoActivo?.id ?? null,
              asignacionActual: asignacion
                ? (this.enrichAsignacion(
                    asignacion,
                    vehiculoMap,
                    new Map([[empleado.id, empleado]])
                  ) ?? null)
                : null,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            const fechaA = a?.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
            const fechaB = b?.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
            return fechaB - fechaA;
          }),
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    } finally {
      await ekQr.release();
    }
  }

  public async createPrimario(
    body: CreateTrasladoPrimarioDto
  ): Promise<{ trasladoId: number; result: boolean }> {
    let transactionStarted = false;
    try {
      this.ensureTrasladoPrimario(body);
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      this.validateDocumentosUnicos(body.conductor, body.auxiliar, body.medico);

      const trasladoRp = this.qr.manager.getRepository(TrasladoAsistencialOrm);
      const tramoRp = this.qr.manager.getRepository(TrasladoTramoOrm);
      // const trasladoPacienteRp = this.qr.manager.getRepository(PacienteTrasladoOrm);
      await this.pacienteConTrasladoActivo(body);

      //const trasladoPaciente = await this.createPacientePrimario(body);

      const newTraslado = new TrasladoAsistencialOrm();
      newTraslado.centroId = body.centroId;
      newTraslado.kmInicial = body.kmInicial;
      newTraslado.prenotificaAlSitio = body.prenotificaAlSitio;
      newTraslado.fechaHoraVistoBien = body.fechaHoraVistoBienPaciente
        ? new Date(body.fechaHoraVistoBienPaciente)
        : null;
      newTraslado.cupsCode = body.cupsCode;
      newTraslado.tipoRemisionCode = body.tipoRemisionCode;
      newTraslado.otroTipoRemision = body.otroTipoRemision;
      newTraslado.diagnosticoId = body.diagPrincipalId;
      newTraslado.diagSecundarioId = body.diagSecundarioId;
      newTraslado.hallazgos = body.hallazgosClinicos;
      newTraslado.triageImg = body.bodyMapImageName;
      newTraslado.estadoPacienteCode = body.estadoPacienteCode;
      newTraslado.acompananteNombre = body.acompananteNombre;
      newTraslado.acompananteDocumento = body.acompananteNumero;
      newTraslado.usuarioId = this.auth.id;
      newTraslado.tipoCode = ASISTENCIA_TIPOS.PRIMARIO.getCode();
      newTraslado.estadoCode = ESTADOS_ASISTENCIA.FINALIZADO.getCode();
      newTraslado.fechaCreacion = new Date();
      //newTraslado.observacion = body.observacion;
      newTraslado.isDeleted = false;

      if (body.pacienteId) {
        await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, body.pacienteId);

        newTraslado.pacienteId = body.pacienteId;
      }

      if (body.pacienteTemporal) {
        const paciente = await this.createPacientePrimario(body);
        newTraslado.ekPacienteId = paciente.id;
      }

      if (body.tiposCondicionClinicaCodes?.length > 0) {
        newTraslado.condicionClinica = body.tiposCondicionClinicaCodes.map(item => item).join(',');
      }

      const trasladoCreado = await trasladoRp.save(newTraslado);

      if (body.medicamentosPrevios?.length) {
        await this.createMedicamentosPrevios(trasladoCreado.id, body.medicamentosPrevios);
      }

      const newTramo = new TrasladoTramoOrm();

      const origen = await this.resolveUbicacion(body.origen);

      const destino = await this.resolveUbicacion(body.destino);

      newTramo.trasladoId = trasladoCreado.id;
      newTramo.orden = 1;
      newTramo.tipoTramoCode = 1;
      newTramo.origenId = origen.origenId;
      newTramo.ekOrigenId = origen.ekOrigenId;
      newTramo.destinoId = destino.origenId;
      newTramo.ekDestinoId = destino.ekOrigenId;
      newTramo.estadoCode = ESTADOS_ASISTENCIA.FINALIZADO.getCode();
      newTramo.isActivo = false;
      newTramo.horaSolicitud = body.solicitadoEl ? new Date(body.solicitadoEl) : new Date();
      newTramo.horaDespacho = body.despachoHora ? new Date(body.despachoHora) : new Date();
      newTramo.horaLlegadaEscena = body.llegadaEscenaHora
        ? new Date(body.llegadaEscenaHora)
        : undefined;
      newTramo.horaSalidaEscena = body.salidaEscenaHora
        ? new Date(body.salidaEscenaHora)
        : undefined;
      newTramo.horaInicioRecorrido = new Date(body.salidaEscenaHora);
      newTramo.horaLlegadaInst = new Date(body.llegadaInstitucionHora);
      newTramo.horaRecepcionInst = new Date(body.recepcionInstitucionHora);
      newTramo.kmInicial = body.kmInicial;
      newTramo.kmFinal = body.kmFinal;
      newTramo.recibidoPorNombre = body.recibidoPorNombre.trim();
      newTramo.recibidoPorDocumento = body.recibidoPorDocumento.trim();
      newTramo.firmaImg = body.recibidoPorFirmaImg;

      const tramo = await tramoRp.save(newTramo);

      const asignacionCreada = await this.createInitialAssignment(
        trasladoCreado.id,
        tramo.id,
        body
      );

      await this.createSignosVitales(trasladoCreado.id, tramo.id, body.signosVitales);

      await this.createNotas(
        trasladoCreado.id,
        tramo.id,
        body.notas,
        undefined,
        asignacionCreada.id
      );

      await this.createProcedimientos(
        trasladoCreado.id,
        tramo.id,
        body.procedimientos,
        undefined,
        asignacionCreada.id
      );

      await this.createMedicamentos(
        trasladoCreado.id,
        tramo.id,
        body.medicamentos,
        undefined,
        asignacionCreada.id
      );

      await this.createEstadoHistorial({
        trasladoId: trasladoCreado.id,
        tramoId: tramo.id,
        estadoCode: ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
        observacion: 'Traslado primario registrado',
      });

      await this.qr.commitTransaction();
      return { trasladoId: trasladoCreado.id, result: true };
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      if (body.bodyMapImageName) {
        deleteFile(`${LGC_TAS_LOCATIONS.triage}/${body.bodyMapImageName}`);
      }
      if (body.recibidoPorFirmaImg) {
        deleteFile(`${LGC_TAS_LOCATIONS.firma}/${body.recibidoPorFirmaImg}`);
      }
      /*     if (body.archivosAdjuntos?.length) {
        body.archivosAdjuntos.forEach(archivo => {
          deleteFile(`${LGC_TAS_LOCATIONS.archivos}/${archivo.nombre}`);
        });
      } */
      throw new BadRequestException(error.message);
    } finally {
      if (!this.qr.isReleased) await this.qr.release();
    }
  }

  public async inicioSecundario(body: IniciarTrasladoDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      if (!body?.trasladoId) {
        throw new Error('trasladoId es obligatorio');
      }

      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);
      const tramoRp = qr.manager.getRepository(TrasladoTramoOrm);
      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);
      const tramo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      if (ESTADOS_ASISTENCIA.EN_CURSO.getCode() === traslado.estadoCode) {
        throw new Error('El traslado ya se encuentra en curso');
      }

      if (
        ![
          ESTADOS_ASISTENCIA.RECIBIDO.getCode(),
          ESTADOS_ASISTENCIA.PENDIENTE_RETORNO.getCode(),
        ].includes(traslado.estadoCode)
      ) {
        throw new Error(
          'El traslado debe estar recibido o pendiente retorno antes de iniciar el formulario secundario'
        );
      }

      const fechaHoraLLegadaRecoger = new Date(body.fechaHoraLlegadaSitioRecoger);

      if (Number.isNaN(fechaHoraLLegadaRecoger.getTime())) {
        throw new Error(
          'No es posible iniciar el traslado: fechaHoraLlegadaSitioRecoger es inválida'
        );
      }

      const fechaHoraInicioRegistro = new Date(body.fechaHoraInicio);

      if (Number.isNaN(fechaHoraInicioRegistro.getTime())) {
        throw new Error('No es posible iniciar el traslado: fechaHoraInicioRegistro es inválida');
      }

      const fechaCreacion = new Date(traslado.fechaCreacion);

      const fechaHoraActual = new Date();

      if (fechaHoraInicioRegistro > fechaHoraActual) {
        throw new Error(
          'No es posible iniciar el traslado: la fecha de inicio del traslado no puede ser mayor a la fecha actual.'
        );
      }

      if (fechaHoraLLegadaRecoger > fechaHoraActual) {
        throw new Error(
          'No es posible iniciar el traslado: la fecha de llegada al sitio no puede ser mayor a la fecha actual.'
        );
      }

      if (fechaHoraLLegadaRecoger < fechaCreacion) {
        throw new Error(
          'No es posible iniciar el traslado: la fecha de llegada al sitio no puede ser anterior a la fecha de creación del traslado.'
        );
      }

      if (fechaHoraInicioRegistro < fechaHoraLLegadaRecoger) {
        throw new Error(
          'No es posible iniciar el traslado: la fecha de inicio de traslado no puede ser posterior a la fecha de llegada al sitio.'
        );
      }

      await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramo.id,
        body.vehiculoId,
        qr
      );

      traslado.estadoCode = ESTADOS_ASISTENCIA.EN_CURSO.getCode();
      traslado.kmInicial = body.kmInicial;
      tramo.kmInicial = body.kmInicial;
      tramo.horaInicioRecorrido = fechaHoraInicioRegistro;
      tramo.horaLlegadaEscena = fechaHoraLLegadaRecoger;
      tramo.horaSalidaEscena = fechaHoraInicioRegistro;
      tramo.estadoCode = ESTADOS_ASISTENCIA.EN_CURSO.getCode();

      await trasladoRp.save(traslado);

      await tramoRp.save(tramo);
      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramo.id,
        estadoCode: ESTADOS_ASISTENCIA.EN_CURSO.getCode(),
        observacion: 'Formulario secundario actualizado e inicio de traslado registrado',
        qr,
        fechaRegistro: fechaHoraInicioRegistro,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (!qr.isReleased) await qr.release();
    }
  }

  public async createSecundario(
    body: CreateTrasladoSecundarioDto
  ): Promise<{ trasladoId: number; result: boolean }> {
    let transactionStarted = false;
    try {
      //await this.verifyEntityExist(TABLE_NAMES.adn.centros, body.centroId);
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;
      await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, body.pacienteId);

      const trasladoRp = this.qr.manager.getRepository(TrasladoAsistencialOrm);
      const tramoRp = this.qr.manager.getRepository(TrasladoTramoOrm);

      //const trasladoPaciente = await this.createPacienteExistente(body);

      // await this.pacienteConTrasladoActivo(body);

      const newTraslado = new TrasladoAsistencialOrm();

      newTraslado.centroId = body.centroId;
      newTraslado.pacienteId = body.pacienteId;
      newTraslado.usuarioId = this.auth.id;
      newTraslado.cupsCode = body.cupsCode;
      newTraslado.tipoCode = body.tipoCode;
      newTraslado.estadoCode = ESTADOS_ASISTENCIA.CREADO.getCode();
      newTraslado.tipoRemisionCode = body.tipoRemisionCode;
      newTraslado.otroTipoRemision = body.otroTipoRemision;
      newTraslado.tipoRecorridoCode = body.tipoRecorridoCode;
      newTraslado.tipoTrasladoCode = body.tipoTrasladoCode;
      newTraslado.isDeleted = false;

      if (body.tipoSoportesVitales.length > 0) {
        newTraslado.tipoSoporteVital = body.tipoSoportesVitales.map(item => item.code).join(',');
      }

      if (body.otroSoporteVital) {
        newTraslado.otroSignoVital = body.otroSoporteVital;
      }

      newTraslado.servicioRequeridoId = body.servicioRequeridoId;

      newTraslado.fechaCreacion = new Date();

      newTraslado.fechaProgramada = new Date(body.fechaHoraProgramada);

      newTraslado.observacion = body.observacion;

      const trasladoCreado = await trasladoRp.save(newTraslado);

      const tramos = this.buildTramos(body);

      const origen = await this.resolveUbicacion(body.origen);

      const destino = await this.resolveUbicacion(body.destino);

      let tramoActivoId: number | undefined;

      for (const tramo of tramos) {
        const tramoCreado = await tramoRp.save(
          tramoRp.create({
            trasladoId: trasladoCreado.id,
            orden: tramo.orden,
            tipoTramoCode: tramo.tipoTramoCode,
            origenId: tramo.orden === 1 ? origen.origenId : destino.origenId,
            ekOrigenId: tramo.orden === 1 ? origen.ekOrigenId : destino.ekOrigenId,
            destinoId: tramo.orden === 1 ? destino.origenId : origen.origenId,
            ekDestinoId: tramo.orden === 1 ? destino.ekOrigenId : origen.ekOrigenId,
            estadoCode: ESTADOS_ASISTENCIA.CREADO.getCode(),
            tipoTrasladoCode: body.tipoTrasladoCode,
            isActivo: tramo.orden === 1,
          })
        );

        if (tramo.orden === 1) {
          tramoActivoId = tramoCreado.id;
        }
      }

      await this.createEstadoHistorial({
        trasladoId: trasladoCreado.id,
        tramoId: tramoActivoId as number,
        estadoCode: ESTADOS_ASISTENCIA.CREADO.getCode(),
        observacion: 'Traslado registrado',
      });

      await this.qr.commitTransaction();
      return { trasladoId: trasladoCreado.id, result: true };
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (!this.qr.isReleased) await this.qr.release();
    }
  }

  public async getDignosticos(ingresoId: number, contexto: GcmContextType) {
    const connLocal = this.dynamicConn(contexto);
    const subQuery = connLocal
      .createQueryBuilder()
      .select('D.DIACODIGO', 'codigo')
      .addSelect('MAX(F.HCFECFOL)', 'fecha')
      .from(FolioOrm, 'F')
      .innerJoin(DiagPacienteOrm, 'DP', 'DP.HCNFOLIO = F.OID')
      .innerJoin(DiagnosticoOrm, 'D', 'DP.GENDIAGNO = D.OID')
      .where('F.ADNINGRESO = :ingreso')
      .andWhere('DP.HCPDIAPRIN = :principal')
      .groupBy('D.DIACODIGO');

    const data = await connLocal
      .getRepository(FolioOrm)
      .createQueryBuilder('F')
      .innerJoin(DiagPacienteOrm, 'DP', 'DP.HCNFOLIO = F.OID')
      .innerJoin(DiagnosticoOrm, 'D', 'DP.GENDIAGNO = D.OID')
      .innerJoin(UsuarioOrm, 'U', 'U.OID = F.GENMEDICO')
      .innerJoin(`(${subQuery.getQuery()})`, 'X', 'X.codigo = D.DIACODIGO AND X.fecha = F.HCFECFOL')
      .setParameters({
        ...subQuery.getParameters(),
        ingreso: ingresoId,
        principal: 1,
      })
      .select('F.HCFECFOL', 'fecha')
      .addSelect('D.DIACODIGO', 'codigo')
      .addSelect('D.DIANOMBRE', 'nombre')
      .addSelect('U.USUNOMBRE', 'documentoMedico')
      .addSelect('U.USUDESCRI', 'nombreMedico')
      .addSelect("ISNULL(DP.HCPOBSERV, 'SIN OBSERVACIONES')", 'observacion')
      .where('F.ADNINGRESO = :ingreso')
      .andWhere('DP.HCPDIAPRIN = :principal')
      .orderBy('F.HCFECFOL', 'DESC')
      .getRawMany();

    const result: TDiagnosticoRes[] = data.map(item => ({
      fechaFolio: item.fecha,
      diagnostico: {
        codigo: item.codigo,
        nombre: item.nombre,
      },
      medico: {
        nombre: item.nombreMedico,
        documento: item.documentoMedico,
      },
      observacion: item.observacion,
    }));

    return result;
  }
}
