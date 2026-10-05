import { TABLE_NAMES } from '@common/application/constants';
import { BaseSource } from '@common/infrastructure/services';
import { ESTADOS, RECIBIDO } from '@gestion-clinica/entrega-turnos/application/types';
import {
  CreateTurnoDto,
  CreateEntregaTurnoDto,
  CreateRecibeTurnoDto,
  fetchTurnoDto,
  HabilitaRTurnoDto,
} from '@gestion-clinica/entrega-turnos/presentation/dtos/create-entrega-turno';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CambioTurnoOrm,
  EntregaTurnoOrm,
  ETPacienteTurnoOrm,
  PacienteEvolucionOrm,
} from '@orm/gcn';
import { EstanciaOrm } from '@orm/temp';
import { Between, IsNull } from 'typeorm';
@Injectable()
export class TurnoSource extends BaseSource {
  public async create(body: CreateTurnoDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);

      transactionStarted = true;

      await this.qr.connect();

      await this.qr.startTransaction();

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);

      const cambioTurnoRp = this.qr.manager.getRepository(CambioTurnoOrm);

      const ultimoTurno = await entregaTurnoRp.findOne({
        where: { subgrupoId: body.subgrupoId, centroAtencionId: body.centroId },
        order: { id: 'DESC' },
      });

      if (ultimoTurno) {
        if (ultimoTurno.isActivo) {
          throw new Error('Este subgrupo cuenta con un turno activo');
        }
        /*   if (ultimoTurno.medicoRecibeTurnoId) {
            if (ultimoTurno.medicoRecibeTurnoId !== this.auth.id) {
              throw new Error('Usted no puede iniciar este turno, no esta asignado');
            }
          } */
      }

      const newEntregaTurno = entregaTurnoRp.create({
        centroAtencionId: body.centroId,
        subgrupoId: body.subgrupoId,
        medicoEntregaTurnoId: this.auth.id,
        estadoCode: ESTADOS.EN_PROCESO.getCode(),
        fecha: new Date(),
        isActivo: true,
      });

      const entregaTurnoCreada = await entregaTurnoRp.save(newEntregaTurno);

      const medicoIds = body.medicoIds;

      if (medicoIds.length > 0) {
        await Promise.all(body.medicoIds.map(id => this.verifyEntityExist('GENUSUARIO', id)));

        const cambios = body.medicoIds.map(id =>
          cambioTurnoRp.create({
            entregaTurnoId: entregaTurnoCreada.id,
            fecha: new Date(),
            medicoId: id,
            motivo: 'AYUDANTE',
            tipo: 2,
          })
        );
        await cambioTurnoRp.save(cambios);
      }
      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async habilitarTurno(body: HabilitaRTurnoDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);

      transactionStarted = true;

      await this.qr.connect();

      await this.qr.startTransaction();

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);

      const entregaTurno = await entregaTurnoRp.findOne({
        where: { subgrupoId: body.subgrupoId, centroAtencionId: body.centroId },
        order: { id: 'DESC' },
      });

      if (!entregaTurno) {
        throw new Error('No hay un turno iniciado actualmente.');
      }

      if (entregaTurno.habilitadoId) {
        throw new Error('Este subgrupo ya fue habilitado');
      }

      if (entregaTurno.estadoCode === ESTADOS.NO_ENTREGADO.getCode()) {
        throw new Error('Este subgrupo ya fue habilitado');
      }

      let fechaBase: Date | null = null;

      if (entregaTurno.estadoCode === ESTADOS.ENTREGADO.getCode()) {
        fechaBase = entregaTurno.fechaEntrega ? new Date(entregaTurno.fechaEntrega) : null;
      } else {
        fechaBase = entregaTurno.fecha ? new Date(entregaTurno.fecha) : null;
      }

      if (fechaBase) {
        const ahora = new Date();
        const diferenciaMs = ahora.getTime() - fechaBase.getTime();
        const minutos = diferenciaMs / (1000 * 60);
        if (minutos < 240) {
          const restante = Math.ceil(240 - minutos);
          const horas = Math.floor(restante / 60);
          const mins = restante % 60;
          const mensaje = horas > 0 ? `${horas}h ${mins}min` : `${mins}min`;
          throw new Error(`Debe esperar ${mensaje} más para habilitar el turno`);
        }
      }

      if (entregaTurno.fechaEntrega && entregaTurno.fechaRecibido) {
        const newEntregaTurnoRecibicoNoEntregado = new EntregaTurnoOrm();
        newEntregaTurnoRecibicoNoEntregado.subgrupoId = body.subgrupoId;
        newEntregaTurnoRecibicoNoEntregado.centroAtencionId = body.centroId;
        newEntregaTurnoRecibicoNoEntregado.fecha = new Date();
        newEntregaTurnoRecibicoNoEntregado.medicoEntregaTurnoId = entregaTurno.medicoRecibeTurnoId;
        newEntregaTurnoRecibicoNoEntregado.isActivo = false;
        newEntregaTurnoRecibicoNoEntregado.estadoCode = ESTADOS.NO_ENTREGADO.getCode();
        newEntregaTurnoRecibicoNoEntregado.observacion = body.motivo;
        newEntregaTurnoRecibicoNoEntregado.habilitadoId = this.auth.id;
        await entregaTurnoRp.save(newEntregaTurnoRecibicoNoEntregado);

        if (entregaTurno.isActivo) {
          entregaTurno.isActivo = false;
          await entregaTurnoRp.save(entregaTurno);
        }
      }
      if (
        [
          ESTADOS.PENDIENTE.getCode(),
          ESTADOS.EN_PROCESO.getCode(),
          ESTADOS.ENTREGADO.getCode(),
        ].includes(entregaTurno.estadoCode)
      ) {
        entregaTurno.estadoCode =
          ESTADOS.ENTREGADO.getCode() === entregaTurno.estadoCode
            ? ESTADOS.NO_RECIBIDO.getCode()
            : ESTADOS.NO_ENTREGADO.getCode();
        entregaTurno.isActivo = false;
        entregaTurno.observacion = body.motivo;
        entregaTurno.habilitadoId = this.auth.id;
        await entregaTurnoRp.save(entregaTurno);
      }

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async fetchTurnosByRangoFecha(body: fetchTurnoDto) {
    await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);

    const entregaTurnoRp = this.conn.getRepository(EntregaTurnoOrm);

    const entregaTurno = await entregaTurnoRp.find({
      where: {
        subgrupoId: body.subgrupoId,
        isActivo: false,
        fecha: Between(new Date(body.fechaInicio), new Date(body.fechaFinal)),
      },
      relations: [
        'medicoEntrega',
        'medicoRecibe',
        'subgrupo',
        'pacientesTurnos',
        'cambiosTurno',
        'cambiosTurno.medico',
      ],
      order: { id: 'DESC' },
    });

    return entregaTurno;
  }

  public async findTurnoBySubgrupoId() {
    const entregaTurnoRp = this.conn.getRepository(EntregaTurnoOrm);

    const subQuery = entregaTurnoRp
      .createQueryBuilder('turno')
      .select('MAX(turno.id)', 'maxId')
      .groupBy('turno.subgrupoId');

    const entregaTurnos = await entregaTurnoRp
      .createQueryBuilder('turno')
      .leftJoinAndSelect('turno.medicoEntrega', 'medicoEntrega')
      .leftJoinAndSelect('turno.medicoRecibe', 'medicoRecibe')
      .leftJoinAndSelect('turno.subgrupo', 'subgrupo')
      .leftJoinAndSelect('turno.pacientesTurnos', 'pacientesTurnos')
      .leftJoinAndSelect('turno.cambiosTurno', 'cambiosTurno')
      .leftJoinAndSelect('cambiosTurno.medico', 'medico')
      .where(`turno.id IN (${subQuery.getQuery()})`)
      .setParameters(subQuery.getParameters())
      .orderBy('turno.id', 'ASC')
      .getMany();

    return entregaTurnos;
  }

  public async entrega(body: CreateEntregaTurnoDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      await this.verifyEntityExist(TABLE_NAMES.adn.centros, body.centroId);
      await this.verifyEntityExist(TABLE_NAMES.gen.usu.usuarios, body.medicoRecibeId);

      for (const paciente of body.pacientes) {
        await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, paciente.id);
        await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, paciente.ingreso);
      }

      await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);

      transactionStarted = true;

      await this.qr.connect();

      await this.qr.startTransaction();

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);

      const etPacienteTurnoRp = this.qr.manager.getRepository(ETPacienteTurnoOrm);

      const etPacienteEvolucion = this.qr.manager.getRepository(PacienteEvolucionOrm);

      const estanciaRp = this.qr.manager.getRepository(EstanciaOrm);

      let createEntregaTurno: EntregaTurnoOrm;

      const entregaTurno = await entregaTurnoRp.findOne({
        where: [
          {
            subgrupoId: body.subgrupoId,
            centroAtencionId: body.centroId,
            isActivo: true,
          },
        ],
        relations: ['medicoEntrega', 'medicoRecibe'],
        order: { fecha: 'DESC', id: 'DESC' },
      });

      if (!entregaTurno) {
        throw new Error(`El turno aún no ha sido iniciado por el médico encargado.`);
      }

      /*   if (entregaTurno) { */
      if (entregaTurno.fechaEntrega && entregaTurno.fechaRecibido) {
        throw new Error(
          `Este subgrupo ya fue recibido por ${entregaTurno.medicoRecibe.nombreCompleto}`
        );
      }

      if (entregaTurno.fechaEntrega && !entregaTurno.fechaRecibido) {
        throw new Error(
          `Este subgrupo ya fue entregado por ${entregaTurno.medicoEntrega.nombreCompleto}`
        );
      }

      if (entregaTurno.medicoEntregaTurnoId != this.auth.id) {
        throw new Error('Usted no puede entregar este subgrupo.');
      }
      entregaTurno.fechaEntrega = new Date();
      /* estado nuevo */
      entregaTurno.estadoCode = ESTADOS.ENTREGADO.getCode();
      entregaTurno.medicoRecibeTurnoId = body.medicoRecibeId;
      entregaTurno.centroAtencionId = body.centroId;
      createEntregaTurno = entregaTurno;
      /*}  else {
        const newEntregaTurno = new EntregaTurnoOrm();
        newEntregaTurno.subgrupoId = body.subgrupoId;
        newEntregaTurno.centroAtencionId = body.centroId;
        newEntregaTurno.medicoEntregaTurnoId = this.auth.id;
        newEntregaTurno.fecha = new Date();
        newEntregaTurno.medicoRecibeTurnoId = body.medicoRecibeId;
        newEntregaTurno.fechaEntrega = new Date();
        newEntregaTurno.isActivo = true;

        newEntregaTurno.estadoCode = ESTADOS.ENTREGADO.getCode();
        createEntregaTurno = newEntregaTurno;
      } */

      await entregaTurnoRp.save(createEntregaTurno);

      const estanciasActivas = await estanciaRp.find({
        where: {
          cama: { subGrupoId: body.subgrupoId, centroId: `${body.centroId}` },
          fechaEgreso: IsNull(),
        },
        relations: ['ingreso'],
      });

      const ingresosActivos = new Set(
        estanciasActivas.filter(est => est.ingreso).map(est => est.ingreso.id)
      );

      for (const paciente of body.pacientes) {
        /* paciente no esta activo en el subgrupo */
        if (!ingresosActivos.has(paciente.ingreso)) {
          continue;
        }

        let evolucion = await etPacienteEvolucion.findOne({
          where: { pacienteId: paciente.id, ingresoId: paciente.ingreso },
        });

        if (!evolucion) {
          evolucion = new PacienteEvolucionOrm();
          evolucion.ingresoId = paciente.ingreso;
          evolucion.pacienteId = paciente.id;
          evolucion.usuarioId = this.auth.id;
          evolucion.fecha = new Date();
          evolucion.evolucion = '';
          evolucion = await etPacienteEvolucion.save(evolucion);
        }

        const turnoExistente = await etPacienteTurnoRp.findOne({
          where: {
            pacienteEvolucion: { id: evolucion.id },
            entregaTurnoId: createEntregaTurno.id,
          },
          /* { fechaRecibido: IsNull(), subgrupoId: body.subgrupoId, isActivo: true } */
          relations: ['entregaTurno'],
        });
        if (turnoExistente) {
          turnoExistente.isEntregado = true;
          await etPacienteTurnoRp.save(turnoExistente);
          continue;
        }

        const nuevoPt = new ETPacienteTurnoOrm();
        nuevoPt.entregaTurnoId = createEntregaTurno.id;
        nuevoPt.pacienteEvolucionId = evolucion.id;
        nuevoPt.isEntregado = true;
        await etPacienteTurnoRp.save(nuevoPt);
      }

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async recibe(body: CreateRecibeTurnoDto): Promise<boolean> {
    let transactionStarted = false;
    try {
      // Verificaciones iniciales
      for (const paciente of body.pacientes) {
        await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, paciente.id);
        await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, paciente.ingreso);
      }

      await this.verifyEntityExist('HPNSUBGRU', body.subgrupoId);

      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const entregaTurnoRp = this.qr.manager.getRepository(EntregaTurnoOrm);
      const cambioTurnoRp = this.qr.manager.getRepository(CambioTurnoOrm);
      const etPacienteEvolucion = this.qr.manager.getRepository(PacienteEvolucionOrm);
      const estanciaRp = this.qr.manager.getRepository(EstanciaOrm);
      const etPacienteTurnoRp = this.qr.manager.getRepository(ETPacienteTurnoOrm);

      // Buscar la entrega pendiente por recibir
      const entregaTurno = await entregaTurnoRp.findOne({
        where: {
          subgrupoId: body.subgrupoId,
          centroAtencionId: body.centroId,
          isActivo: true,
        },
        order: { id: 'DESC' },
      });

      if (!entregaTurno) {
        throw new Error('No hay entrega de turno por recibir.');
      }

      if (!entregaTurno.fechaEntrega) {
        throw new Error('No se puede recibir un turno que aún no ha sido entregado.');
      }
      //Validar si el usuario puede recibir
      if (entregaTurno.medicoRecibeTurnoId !== this.auth.id && !body.isCambioTurno) {
        throw new Error('Usted no está autorizado para recibir este turno.');
      }

      if (entregaTurno.estadoCode === RECIBIDO.getCode()) {
        throw new Error('Este caso ya fue recibido...');
      }

      //Registrar cambio de turno (si aplica)
      if (body.isCambioTurno) {
        const cambio = cambioTurnoRp.create({
          entregaTurnoId: entregaTurno.id,
          medicoId: entregaTurno.medicoRecibeTurnoId,
          motivo: body.motivo,
          fecha: new Date(),
          tipo: 1,
        });
        await cambioTurnoRp.save(cambio);
        // El nuevo médico pasa a ser quien recibe
        entregaTurno.medicoRecibeTurnoId = this.auth.id;
      }

      // agregar el recibido o entregado de pacientes falta

      entregaTurno.fechaRecibido = new Date();

      entregaTurno.estadoCode = ESTADOS.RECIBIDO.getCode();

      entregaTurno.isActivo = false;

      const estanciasActivas = await estanciaRp.find({
        where: {
          cama: { subGrupoId: body.subgrupoId, centroId: `${body.centroId}` },
          fechaEgreso: IsNull(),
        },
        relations: ['ingreso'],
      });

      const ingresosActivos = new Set(
        estanciasActivas.filter(est => est.ingreso).map(est => est.ingreso.id)
      );

      for (const paciente of body.pacientes) {
        /* paciente no esta activo en el subgrupo */
        if (!ingresosActivos.has(paciente.ingreso)) {
          continue;
        }

        let evolucion = await etPacienteEvolucion.findOne({
          where: { pacienteId: paciente.id, ingresoId: paciente.ingreso },
        });

        if (!evolucion) {
          evolucion = new PacienteEvolucionOrm();
          evolucion.ingresoId = paciente.ingreso;
          evolucion.pacienteId = paciente.id;
          evolucion.usuarioId = this.auth.id;
          evolucion.fecha = new Date();
          evolucion.evolucion = '';
          evolucion = await etPacienteEvolucion.save(evolucion);
        }

        const turnoExistente = await etPacienteTurnoRp.findOne({
          where: {
            pacienteEvolucion: { id: evolucion.id },
            entregaTurnoId: entregaTurno.id,
          },
          /* { fechaRecibido: IsNull(), subgrupoId: body.subgrupoId, isActivo: true } */
          relations: ['entregaTurno'],
        });
        if (turnoExistente) {
          turnoExistente.isRecibido = true;
          await etPacienteTurnoRp.save(turnoExistente);
          continue;
        }

        const nuevoPt = new ETPacienteTurnoOrm();
        nuevoPt.entregaTurnoId = entregaTurno.id;
        nuevoPt.pacienteEvolucionId = evolucion.id;
        nuevoPt.isRecibido = true;
        await etPacienteTurnoRp.save(nuevoPt);
      }

      await entregaTurnoRp.save(entregaTurno);

      await this.qr.commitTransaction();
      return true;
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
