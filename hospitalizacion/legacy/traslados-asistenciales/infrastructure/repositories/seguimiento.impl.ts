import { BadRequestException, Body, Injectable } from '@nestjs/common';
import { MEDICALIZADO, MEDICALIZADO_NEONATAL } from '@hpn/lgc/tas/types/gcn';
import { ESTADOS_ASISTENCIA } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import {
  AsignarTrasladoDto,
  EntregaMovilDto,
  IniciarRetornoDto,
  RegistrarComplicacionDto,
} from '@hpn/lgc/tas/presentation/dtos';
import { RecursosCompartidosSource } from '../services/recursos';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import {
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoTramoOrm,
} from '@hpn/lgc/tas/orm/gcn/traslados-asistenciales';

@Injectable()
export class SeguimientoTrasladoImpl extends RecursosCompartidosSource {
  public async entregarPaciente(body: EntregaMovilDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      if (!body.trasladoId) {
        throw new Error('trasladoId es obligatorio');
      }

      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);
      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);

      this.signosVitalesCompletos(body);

      if (traslado.estadoCode === ESTADOS_ASISTENCIA.ENTREGADO.getCode()) {
        throw new Error('El traslado ya se encuentra entregado');
      }

      if (traslado.estadoCode !== ESTADOS_ASISTENCIA.ASIGNADO.getCode()) {
        throw new Error('El traslado debe estar asignado para entregar el paciente');
      }
      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      const fechaHoraRegistro = new Date(body.signosVitales.fechaRegistro);

      const fechaHoraCreacion = new Date(traslado.fechaCreacion);

      if (fechaHoraRegistro > new Date()) {
        throw new Error('No se puede entregar el paciente en una fecha posterior a la actual');
      }

      if (fechaHoraRegistro < fechaHoraCreacion) {
        throw new Error(
          'No se puede entregar el paciente antes de la fecha de creación del traslado'
        );
      }

      traslado.estadoCode = ESTADOS_ASISTENCIA.ENTREGADO.getCode();

      await trasladoRp.save(traslado);
      await this.createSignosVitales(
        body.trasladoId,
        tramoActivo.id,
        body.signosVitales
          ? {
              ...body.signosVitales,
              observacion: body.observacion,
            }
          : undefined,
        ESTADOS_ASISTENCIA.ENTREGADO.getCode(),
        qr
      );

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: ESTADOS_ASISTENCIA.ENTREGADO.getCode(),
        observacion: 'Paciente entregado',
        qr,
        fechaRegistro: fechaHoraRegistro,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async recibirPaciente(body: EntregaMovilDto): Promise<boolean> {
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
      //const asignacionRp = qr.manager.getRepository(TrasladoAsignacionOrm);
      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);

      if (traslado.estadoCode === ESTADOS_ASISTENCIA.RECIBIDO.getCode()) {
        throw new Error('El traslado ya se encuentra recibido');
      }

      if (traslado.estadoCode !== ESTADOS_ASISTENCIA.ENTREGADO.getCode()) {
        throw new Error('El traslado debe estar entregado para recibir el paciente');
      }

      this.signosVitalesCompletos(body);

      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      const fechaHoraRegistro = new Date(body.signosVitales.fechaRegistro);

      const fechaHoraCreacion = new Date(traslado.fechaCreacion);

      if (fechaHoraRegistro > new Date()) {
        throw new Error('No se puede recibir el paciente en una fecha posterior a la actual');
      }

      if (fechaHoraRegistro < fechaHoraCreacion) {
        throw new Error('No puedes recibir el paciente antes de la fecha de creación del traslado');
      }

      const asignacionActual = await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramoActivo.id,
        body.vehiculoId,
        qr
      );

      traslado.estadoCode = ESTADOS_ASISTENCIA.RECIBIDO.getCode();

      await trasladoRp.save(traslado);
      await this.createSignosVitales(
        body.trasladoId,
        tramoActivo.id,
        body.signosVitales
          ? {
              ...body.signosVitales,
              observacion: body.observacion,
            }
          : undefined,
        ESTADOS_ASISTENCIA.RECIBIDO.getCode(),
        qr,
        asignacionActual!.asignacionId
      );
      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: ESTADOS_ASISTENCIA.RECIBIDO.getCode(),
        observacion: 'Paciente recibido',
        qr,
        fechaRegistro: fechaHoraRegistro,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async asignar(body: AsignarTrasladoDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    await ekQr.connect();
    try {
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr, true);
      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);
      this.ensureFlujoSecundario(traslado);

      const isMedicalizado =
        traslado.tipoTrasladoCode === MEDICALIZADO.getCode() ||
        traslado.tipoTrasladoCode === MEDICALIZADO_NEONATAL.getCode();

      this.validateDocumentosUnicos(body.conductor, body.auxiliar, body.medico);

      if (isMedicalizado && !body.medico) {
        throw new Error('El médico es obligatorio para asignar un traslado medicalizado');
      }

      if (traslado.estadoCode !== ESTADOS_ASISTENCIA.CREADO.getCode()) {
        throw new Error('Solo se puede asignar un traslado en estado creado');
      }

      const asignacionRp = qr.manager.getRepository(TrasladoAsignacionOrm);

      const activa = await asignacionRp.findOne({
        where: { trasladoId: body.trasladoId, tramoId: tramoActivo.id, isActiva: true },
      });

      if (activa) {
        throw new Error('Ya existe una asignacion activa para este traslado/tramo');
      }

      const recurso = await this.resolveAssignmentResources(body, ekQr);

      if (!recurso.auxiliar) {
        throw new Error('No se encontro auxiliar disponible para la asignacion');
      }

      if (!recurso.conductor) {
        throw new Error('No se encontro conductor disponible para la asignacion');
      }

      if (!recurso.vehiculo) {
        throw new Error('No se encontro vehiculo disponible para la asignacion');
      }

      if (!recurso.medico && body.medico) {
        throw new Error('No se encontro medico disponible para la asignacion');
      }

      await asignacionRp.save(
        asignacionRp.create({
          trasladoId: body.trasladoId,
          tramoId: tramoActivo.id,
          vehiculoId: recurso.vehiculo.id,
          conductorId: recurso.conductor.id,
          auxiliarId: recurso.auxiliar.id,
          medicoId: recurso.medico?.id ?? null,
          asignadoPorId: this.auth.id,
          estadoCode: ESTADOS_ASISTENCIA.ASIGNADO.getCode(),
          motivo: body.motivo,
          fechaAsignacion: new Date(),
          isActiva: true,
          centroProcesamiento: this.auth.context.getNumericCode(),
        })
      );

      traslado.estadoCode = ESTADOS_ASISTENCIA.ASIGNADO.getCode();

      await qr.manager.getRepository(TrasladoAsistencialOrm).save(traslado);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: traslado.estadoCode,
        observacion: body.motivo ?? 'Traslado asignado',
        qr,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
      await ekQr.release();
    }
  }

  public async reasignar(body: AsignarTrasladoDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    await ekQr.connect();
    try {
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr, true);
      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);
      this.ensureFlujoSecundario(traslado);

      const isMedicalizado =
        traslado.tipoTrasladoCode === MEDICALIZADO.getCode() ||
        traslado.tipoTrasladoCode === MEDICALIZADO_NEONATAL.getCode();

      this.validateDocumentosUnicos(body.conductor, body.auxiliar, body.medico);

      if (isMedicalizado && !body.medico) {
        throw new Error('El médico es obligatorio para reasignar un traslado medicalizado');
      }

      if (traslado.estadoCode === ESTADOS_ASISTENCIA.EN_CURSO.getCode()) {
        throw new Error('Este traslado no se puede reasignar porque se encuentra en curso');
      }

      const asignacionRp = qr.manager.getRepository(TrasladoAsignacionOrm);
      const activa = await asignacionRp.findOne({
        where: { trasladoId: body.trasladoId, tramoId: tramoActivo.id, isActiva: true },
      });

      if (activa) {
        activa.isActiva = false;
        activa.fechaDesasignacion = new Date();
        activa.motivo = body.motivo ?? activa.motivo;
        await asignacionRp.save(activa);
      }

      const recurso = await this.resolveAssignmentResources(body, ekQr);

      if (!recurso.auxiliar) {
        throw new Error('No se encontro auxiliar disponible para la asignacion');
      }

      if (!recurso.conductor) {
        throw new Error('No se encontro conductor disponible para la asignacion');
      }

      if (!recurso.vehiculo) {
        throw new Error('No se encontro vehiculo disponible para la asignacion');
      }

      if (!recurso.medico && body.medico) {
        throw new Error('No se encontro medico disponible para la asignacion');
      }

      await asignacionRp.save(
        asignacionRp.create({
          trasladoId: body.trasladoId,
          tramoId: tramoActivo.id,
          vehiculoId: recurso.vehiculo.id,
          conductorId: recurso.conductor.id,
          auxiliarId: recurso.auxiliar.id,
          medicoId: recurso.medico?.id ?? null,
          asignadoPorId: this.auth.id,
          estadoCode: ESTADOS_ASISTENCIA.ASIGNADO.getCode(),
          motivo: body.motivo,
          fechaAsignacion: new Date(),
          isActiva: true,
          centroProcesamiento: this.auth.context.getNumericCode(),
        })
      );

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: ESTADOS_ASISTENCIA.REASIGNADO.getCode(),
        observacion: body.motivo ?? 'Traslado reasignado',
        qr,
      });

      // throw new Error('testesignacion 79');

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
      await ekQr.release();
    }
  }

  public async iniciarRetorno(body: IniciarRetornoDto): Promise<true> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));

    try {
      if (!body?.trasladoId) {
        throw new Error('trasladoId es obligatorio');
      }

      if (!body?.vehiculoId) {
        throw new Error('vehiculoId es obligatorio');
      }

      if (!body.isEspera) {
        if (!body.horasEspera) {
          throw new Error('Tiempo de espera es obligatorio');
        }
        if (!body.descripcion) {
          throw new Error('Descripción de espera es obligatoria');
        }
      }

      const fechaHoraInicioRetorno = new Date(body.fechaHoraInicioRetorno);

      const fechaHoraLlegadaSitio = new Date(body.fechaHoraLlegadaSitio);

      if (fechaHoraLlegadaSitio > new Date()) {
        throw new Error('Fecha de llegada al sitio no puede ser mayor a la fecha actual');
      }

      if (fechaHoraInicioRetorno > new Date()) {
        throw new Error('Fecha de inicio de retorno no puede ser mayor a la fecha actual');
      }

      if (fechaHoraInicioRetorno < fechaHoraLlegadaSitio) {
        throw new Error(
          'La fecha de inicio de retorno debe ser mayor a la fecha de llegada al sitio'
        );
      }

      await qr.connect();
      await qr.startTransaction();

      transactionStarted = true;

      const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);
      const tramoRp = qr.manager.getRepository(TrasladoTramoOrm);

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);
      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      const tramoAnterior = await tramoRp.findOne({
        where: {
          trasladoId: body.trasladoId,
          tipoTramoCode: 1,
        },
      });

      const fechaRecepcionInstTramoAnterior = new Date(tramoAnterior.horaRecepcionInst);

      if (fechaRecepcionInstTramoAnterior > fechaHoraLlegadaSitio) {
        throw new Error(
          'La fecha y hora de recepción del tramo 1 no puede ser mayor a la fecha y hora de llegada al sitio'
        );
      }

      if (traslado.estadoCode !== ESTADOS_ASISTENCIA.PENDIENTE_RETORNO.getCode()) {
        throw new Error('El traslado debe estar pendiente de retorno para iniciar el retorno');
      }

      await this.fetchAsignacionTramoActualConTripulacion(
        traslado.id,
        tramoActivo.id,
        body.vehiculoId,
        qr
      );

      traslado.estadoCode = ESTADOS_ASISTENCIA.EN_CURSO.getCode();

      if (!body.isEspera) {
        tramoActivo.horasEspera = body.horasEspera;
        tramoActivo.descripcionEspera = body.descripcion;
      }
      tramoActivo.horaInicioRecorrido = new Date(body.fechaHoraInicioRetorno);
      tramoActivo.horaLlegadaEscena = new Date(body.fechaHoraLlegadaSitio);
      tramoActivo.horaSalidaEscena = new Date(body.fechaHoraInicioRetorno);
      tramoActivo.estadoCode = ESTADOS_ASISTENCIA.EN_CURSO.getCode();
      tramoActivo.kmInicial = body.kmInicial;

      await trasladoRp.save(traslado);

      await tramoRp.save(tramoActivo);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: ESTADOS_ASISTENCIA.EN_CURSO.getCode(),
        observacion: 'Retorno redondo iniciado',
        qr,
        fechaRegistro: new Date(body.fechaHoraInicioRetorno),
      });

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async registrarComplicacion(body: RegistrarComplicacionDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      if (!body.trasladoId) {
        throw new Error('trasladoId es obligatorio');
      }

      if (!body.vehiculoId) {
        throw new Error('vehiculoId es obligatorio');
      }

      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const trasladoRp = qr.manager.getRepository(TrasladoAsistencialOrm);
      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);
      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      if (traslado.estadoCode !== ESTADOS_ASISTENCIA.EN_CURSO.getCode()) {
        throw new Error('Solo se puede registrar una complicación si el traslado está en curso');
      }

      const asignacionActual = await this.fetchAsignacionTramoActualConTripulacion(
        traslado.id,
        tramoActivo.id,
        body.vehiculoId,
        qr
      );

      const authDocument = this.getAuthDocument();
      const docsPermitidos = [
        asignacionActual.auxiliar?.documento,
        asignacionActual.medico?.documento,
      ]
        .filter(Boolean)
        .map(doc => `${doc}`.trim());

      if (!docsPermitidos.includes(authDocument)) {
        throw new Error('Solo el auxiliar o el médico asignado pueden registrar complicaciones');
      }

      if (tramoActivo.causaDesviacion) {
        throw new Error('Ya se ha registrado una complicación para este tramo activo');
      }

      tramoActivo.causaDesviacion = body.causa;
      tramoActivo.nombreIps = body.ips;
      tramoActivo.kmDesviacion = body.kmDesviacion;
      tramoActivo.tiempoUtilizado = body.tiempoUtilizado;
      if (body.ips) {
        tramoActivo.ingresoIps = true;
      }

      await trasladoRp.save(traslado);
      const tramoRp = qr.manager.getRepository(TrasladoTramoOrm);
      await tramoRp.save(tramoActivo);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: traslado.estadoCode,
        observacion: `Complicación registrada: ${body.causa}${
          body.ips ? ` en IPS ${body.ips}` : ''
        }`,
        qr,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }
}
