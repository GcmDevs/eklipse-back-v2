import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { deleteFile } from '@common/presentation/helpers';
import {
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoNotaOrm,
  TrasladoSignosVitalesOrm,
  TrasladoTramoOrm,
  ProcedimientoOrm,
  MedicamentoOrm,
  ProcedimientoTempOrm,
} from '@hpn/lgc/tas/orm/gcn';
import { ServicioIpsOrm, UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import {
  CreateMedicamentoDto,
  CreateNotaTrasladoDto,
  CreateProcedimientoDto,
  CreateProcedimientosListaDto,
  CreateSignosVitalesDto,
  CreateUltimaVeZVistoBienDto,
  FinalizarTrasladoEvolucionDto,
} from '@hpn/lgc/tas/presentation/dtos';
import { ESTADOS_ASISTENCIA } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales/estado-asistencia';
import { RecursosCompartidosSource } from '../services';
import { MEDICALIZADO, MEDICALIZADO_NEONATAL, TIPOS_TRASLADO } from '@hpn/lgc/tas/types/gcn';
import { GCM_CONTEXTS, GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { LGC_TAS_LOCATIONS } from '../../application/constants';

@Injectable()
export class TrasladoEvolucionImpl extends RecursosCompartidosSource {
  public async addSignosVitales(body: CreateSignosVitalesDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      //  await this.verifyEntityExist(TABLE_NAMES.hpn.trasladosAsistenciales.index, body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);

      if (
        [ESTADOS_ASISTENCIA.CANCELADO.getCode(), ESTADOS_ASISTENCIA.FINALIZADO.getCode()].includes(
          traslado.estadoCode
        )
      ) {
        throw new Error('El traslado no permite mas registros clinicos/operativos');
      }

      const tramo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      const fechaHoraRegistro = new Date(body.signosVitales.fechaRegistro);

      if (fechaHoraRegistro > new Date()) {
        throw new Error(
          'No es posible registrar los signos vitales: la fecha y hora de registro no puede ser posterior a la fecha y hora actual.'
        );
      }

      if (fechaHoraRegistro < new Date(tramo.horaInicioRecorrido)) {
        throw new Error(
          'No es posible registrar los signos vitales: la fecha y hora de registro no puede ser anterior al inicio del recorrido.'
        );
      }

      const asignacion = await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramo.id,
        body.vehiculoId,
        qr
      );

      const repo = qr.manager.getRepository(TrasladoSignosVitalesOrm);
      const signo = body.signosVitales;

      if (!signo) {
        throw new Error('Debe enviar signosVitales con el orden: ta, fc, fr, sato2, fcf, glasgow');
      }

      await repo.save(
        repo.create({
          trasladoId: body.trasladoId,
          tramoId: tramo.id,
          momentoCode: traslado.estadoCode,
          usuarioId: this.auth.id,
          ta: signo.ta,
          fc: signo.fc,
          fr: signo.fr,
          sat: signo.sato2,
          fcf: signo.fcf,
          glasgow: signo.glasgow,
          observacion: body.observacion,
          fecha: new Date(),
          fechaRegistro: signo.fechaRegistro ? new Date(signo.fechaRegistro) : new Date(),
          centroProcesamiento: this.auth.context.getNumericCode(),
          asignacionId: asignacion.asignacionId,
        })
      );

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async createNota(body: CreateNotaTrasladoDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      //  await this.verifyEntityExist(TABLE_NAMES.hpn.trasladosAsistenciales.index, body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      await this.getTrasladoOrFail(body.trasladoId, qr);

      const tramo = await this.getActiveTramoOrFail(body.trasladoId, qr);
      const asignacion = await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramo.id,
        body.vehiculoId,
        qr
      );

      if (!body.fechaHoraRegistro) {
        throw new Error('Debe enviar fechaHoraRegistro');
      }

      const fechaHoraRegistro = new Date(body.fechaHoraRegistro);

      if (fechaHoraRegistro > new Date()) {
        throw new Error(
          'No es posible registrar la nota: la fecha y hora de registro no puede ser posterior a la fecha y hora actual.'
        );
      }

      if (fechaHoraRegistro < new Date(tramo.horaInicioRecorrido)) {
        throw new Error(
          'No es posible registrar la nota: la fecha y hora de registro no puede ser anterior al inicio del recorrido.'
        );
      }

      const repo = qr.manager.getRepository(TrasladoNotaOrm);
      await repo.save(
        repo.create({
          trasladoId: body.trasladoId,
          tramoId: tramo.id,
          usuarioId: this.auth.id,
          nota: body.nota.toUpperCase(),
          fecha: new Date(),
          fechaRegistro: fechaHoraRegistro,
          centroProcesamiento: this.auth.context.getNumericCode(),
          asignacionId: asignacion.asignacionId,
        })
      );

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async createProcedimiento(body: CreateProcedimientoDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      //await this.verifyEntityExist(TABLE_NAMES.hpn.trasladosAsistenciales.index, body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      await this.getTrasladoOrFail(body.trasladoId, qr);

      const tramo = await this.getActiveTramoOrFail(body.trasladoId, qr);
      const asignacion = await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramo.id,
        body.vehiculoId,
        qr
      );
      if (!body.procedimientos?.length) {
        throw new Error('Debe enviar al menos un procedimiento');
      }

      for (const procedimiento of body.procedimientos) {
        const fechaHoraRegistro = new Date(procedimiento.fechaHoraRegistro);

        if (fechaHoraRegistro > new Date()) {
          throw new Error(
            'No es posible registrar el procedimiento: la fecha y hora de registro no puede ser posterior a la fecha y hora actual.'
          );
        }

        if (fechaHoraRegistro < new Date(tramo.horaInicioRecorrido)) {
          throw new Error(
            'No es posible registrar el procedimiento: la fecha y hora de registro no puede ser anterior al inicio del recorrido.'
          );
        }
      }

      await this.createProcedimientos(
        body.trasladoId,
        tramo.id,
        body.procedimientos,
        qr,
        asignacion.asignacionId
      );

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async createUltimaVeZVistoBien(body: CreateUltimaVeZVistoBienDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      // await this.verifyEntityExist(TABLE_NAMES.hpn.trasladosAsistenciales.index, body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);
      const tramo = await this.getActiveTramoOrFail(body.trasladoId, qr);
      await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramo.id,
        body.vehiculoId,
        qr
      );
      if (!body.fechaHoraVistoBienPaciente) {
        throw new Error('Debe enviar la fecha y hora en la que se vio al paciente bien');
      }

      traslado.fechaHoraVistoBien = new Date(body.fechaHoraVistoBienPaciente);

      await qr.manager.save(TrasladoAsistencialOrm, traslado);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramo.id,
        estadoCode: traslado.estadoCode,
        observacion: `Se registra última vez visto bien`,
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

  public async createMedicamento(body: CreateMedicamentoDto): Promise<boolean> {
    let transactionStarted = false;
    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));
    try {
      //await this.verifyEntityExist(TABLE_NAMES.hpn.trasladosAsistenciales.index, body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      await this.getTrasladoOrFail(body.trasladoId, qr);
      const tramo = await this.getActiveTramoOrFail(body.trasladoId, qr);
      const asignacion = await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramo.id,
        body.vehiculoId,
        qr
      );
      if (!body.medicamentos?.length) {
        throw new Error('Debe enviar al menos un medicamento');
      }

      for (const medicamento of body.medicamentos) {
        const fechaHoraRegistro = new Date(medicamento.fechaHoraRegistro);

        if (fechaHoraRegistro > new Date()) {
          throw new Error(
            'No es posible registrar el medicamento: la fecha y hora de registro no puede ser posterior a la fecha y hora actual.'
          );
        }

        if (fechaHoraRegistro < new Date(tramo.horaInicioRecorrido)) {
          throw new Error(
            'No es posible registrar el medicamento: la fecha y hora de registro no puede ser anterior al inicio del recorrido.'
          );
        }
      }

      await this.createMedicamentos(
        body.trasladoId,
        tramo.id,
        body.medicamentos,
        qr,
        asignacion.asignacionId
      );

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async finalizarTraslado(body: FinalizarTrasladoEvolucionDto): Promise<boolean> {
    let transactionStarted = false;

    if (!body.contextoCode) {
      throw new Error('No se envio contexto de origen');
    }

    const qr = this.dynamicQR(gcmContextFactory(body.contextoCode));

    try {
      // await this.verifyEntityExist(TABLE_NAMES.hpn.trasladosAsistenciales.index, body.trasladoId);
      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      if (!body?.recibidoPorFirmaImg?.trim()) {
        throw new Error('El campo recibidoPorFirma es obligatorio');
      }

      if (!body?.recibidoPorDocumento?.trim()) {
        throw new Error('El campo recibidoPorDocumento es obligatorio');
      }

      if (!body?.recibidoPorNombre?.trim()) {
        throw new Error('El campo recibidoPorNombre es obligatorio');
      }

      if (body?.kmFinal === null || body?.kmFinal === undefined || Number.isNaN(body.kmFinal)) {
        throw new Error('El campo kmFinal es obligatorio');
      }

      const fechaHoraLlegadaInst = new Date(body.fechaHoraLlegadaInst);

      const fechaHoraRecepcionInst = new Date(body.fechaHoraRecepcionInst);

      if (Number.isNaN(fechaHoraLlegadaInst.getTime())) {
        throw new Error('La fecha de llegada a la institucion no es valida');
      }

      if (fechaHoraLlegadaInst > new Date()) {
        throw new Error(
          'La fecha de llegada a la institucion no puede ser posterior a la fecha actual'
        );
      }

      if (fechaHoraRecepcionInst > new Date()) {
        throw new Error(
          'La fecha de llegada a la institucion no puede ser posterior a la fecha actual'
        );
      }

      if (fechaHoraRecepcionInst && fechaHoraRecepcionInst < fechaHoraLlegadaInst) {
        throw new Error(
          'La fecha de recepcion a la institucion no puede ser anterior a la fecha de llegada a la institucion'
        );
      }

      const traslado = await this.getTrasladoOrFail(body.trasladoId, qr);

      this.ensureFlujoSecundario(traslado);

      const tramoActivo = await this.getActiveTramoOrFail(body.trasladoId, qr);

      if (fechaHoraLlegadaInst < new Date(tramoActivo.horaInicioRecorrido)) {
        throw new Error(
          'La fecha de llegada a la institucion no puede ser anterior a la fecha de salida'
        );
      }

      const asignacionActual = await this.fetchAsignacionTramoActualConTripulacion(
        body.trasladoId,
        tramoActivo.id,
        body.vehiculoId,
        qr
      );

      const tramoRp = qr.manager.getRepository(TrasladoTramoOrm);
      const asignacionRp = qr.manager.getRepository(TrasladoAsignacionOrm);
      const notaRp = qr.manager.getRepository(TrasladoNotaOrm);
      const trasladoAsistencialRp = qr.manager.getRepository(TrasladoAsistencialOrm);

      if (
        [ESTADOS_ASISTENCIA.CANCELADO.getCode(), ESTADOS_ASISTENCIA.FINALIZADO.getCode()].includes(
          traslado.estadoCode
        )
      ) {
        throw new Error('El traslado no permite finalizacion');
      }

      const notas = await notaRp.find({
        where: {
          trasladoId: body.trasladoId,
          tramoId: tramoActivo.id,
          asignacionId: asignacionActual.asignacionId,
        },
      });
      const userIdsByContexto = new Map<number, number[]>();
      for (const nota of notas) {
        if (!nota.centroProcesamiento) continue;
        const ctx = nota.centroProcesamiento;
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(nota.usuarioId);
      }

      const usuariosPorContexto = new Map<number, Map<number, any>>();
      await Promise.all(
        Array.from(userIdsByContexto.entries()).map(async ([contexto, ids]) => {
          const usuarios = await this.findUsuarioByContexto(ids, contexto);
          usuariosPorContexto.set(contexto, new Map(usuarios.map(u => [u.id, u])));
        })
      );

      for (const nota of notas) {
        if (nota.centroProcesamiento) {
          nota.usuario =
            usuariosPorContexto.get(nota.centroProcesamiento)?.get(nota.usuarioId) ?? null;
        }
      }

      const auxiliarDocumento = asignacionActual.auxiliar?.documento?.trim();
      if (auxiliarDocumento) {
        const notasAuxiliar = notas.filter(n => n.usuario?.cedula?.trim() === auxiliarDocumento);

        if (notasAuxiliar.length < 2) {
          throw new Error(
            `No se puede finalizar. Faltan ${2 - notasAuxiliar.length} nota(s) del auxiliar`
          );
        }
      }

      const isMedicalizado =
        traslado.tipoTrasladoCode === MEDICALIZADO.getCode() ||
        traslado.tipoTrasladoCode === MEDICALIZADO_NEONATAL.getCode();
      if (isMedicalizado) {
        const medicoDocumento = asignacionActual.medico?.documento?.trim();
        if (medicoDocumento) {
          const notasMedico = notas.filter(n => n.usuario?.cedula?.trim() === medicoDocumento);
          if (notasMedico.length < 2) {
            throw new Error(
              `No se puede finalizar el traslado medicalizado. Faltan ${
                2 - notasMedico.length
              } nota(s) del médico.`
            );
          }
        }
      }

      if (traslado.estadoCode === ESTADOS_ASISTENCIA.EN_CURSO.getCode()) {
        const signosVitalesRp = qr.manager.getRepository(TrasladoSignosVitalesOrm);
        const cantidadSignosVitales = await signosVitalesRp.count({
          where: {
            trasladoId: body.trasladoId,
            tramoId: tramoActivo.id,
            momentoCode: ESTADOS_ASISTENCIA.EN_CURSO.getCode(),
            asignacionId: asignacionActual.asignacionId,
          },
        });

        if (cantidadSignosVitales < 2) {
          throw new Error(
            `No se pude finalizar el traslado falta agregar ${
              2 - cantidadSignosVitales
            } signo(s) vital(es)`
          );
        }
      }

      const kmInicial =
        tramoActivo?.kmInicial !== null && tramoActivo?.kmInicial !== undefined
          ? tramoActivo.kmInicial
          : traslado.kmInicial;

      if (
        kmInicial !== null &&
        kmInicial !== undefined &&
        body.kmFinal !== null &&
        body.kmFinal !== undefined &&
        body.kmFinal < kmInicial
      ) {
        throw new Error('El kilometraje final no puede ser menor que el kilometraje inicial.');
      }

      const estadoPacienteCode = body.estadoPacienteCode;
      const isRedondo =
        traslado.tipoRecorridoCode === TIPOS_TRASLADO.REDONDO.getCode() && tramoActivo.orden === 1;
      const nextTramo = isRedondo
        ? await this.getNextTramo(body.trasladoId, tramoActivo.orden, qr)
        : null;

      if (isRedondo && !nextTramo) {
        throw new Error('El traslado redondo no tiene configurado el tramo de retorno');
      }

      traslado.estadoPacienteCode = estadoPacienteCode;
      tramoActivo.horaRecepcionInst = fechaHoraRecepcionInst;
      tramoActivo.horaLlegadaInst = fechaHoraLlegadaInst;
      tramoActivo.estadoCode = ESTADOS_ASISTENCIA.FINALIZADO.getCode();
      tramoActivo.recibidoPorNombre = body.recibidoPorNombre.trim().toUpperCase();
      tramoActivo.recibidoPorDocumento = body.recibidoPorDocumento.trim().toUpperCase();
      tramoActivo.kmFinal = body.kmFinal;
      tramoActivo.firmaImg = body.recibidoPorFirmaImg;
      tramoActivo.isActivo = false;

      const asignacionActiva = await asignacionRp.findOne({
        where: { trasladoId: body.trasladoId, tramoId: tramoActivo.id, isActiva: true },
        order: { id: 'DESC' },
      });

      if (asignacionActiva) {
        asignacionActiva.isActiva = false;
        asignacionActiva.fechaDesasignacion = fechaHoraRecepcionInst;
        asignacionActiva.estadoCode = ESTADOS_ASISTENCIA.FINALIZADO.getCode();
        await asignacionRp.save(asignacionActiva);
      }

      if (isRedondo) {
        const nextTramoRetorno = nextTramo as TrasladoTramoOrm;
        traslado.estadoCode = ESTADOS_ASISTENCIA.PENDIENTE_RETORNO.getCode();
        nextTramoRetorno.isActivo = true;
        nextTramoRetorno.estadoCode = ESTADOS_ASISTENCIA.PENDIENTE_RETORNO.getCode();
        asignacionRp.save({
          trasladoId: body.trasladoId,
          tramoId: nextTramoRetorno.id,
          vehiculoId: asignacionActiva.vehiculoId,
          conductorId: asignacionActiva.conductorId,
          medicoId: asignacionActiva.medicoId,
          auxiliarId: asignacionActiva.auxiliarId,
          asignadoPorId: this.auth.id,
          estadoCode: ESTADOS_ASISTENCIA.PENDIENTE_RETORNO.getCode(),
          centroProcesamiento: this.auth.context.getNumericCode(),
          fechaAsignacion: new Date(),
          isActiva: true,
        });

        await tramoRp.save(nextTramoRetorno);
      } else {
        traslado.estadoCode = ESTADOS_ASISTENCIA.FINALIZADO.getCode();
      }

      await tramoRp.save(tramoActivo);

      await trasladoAsistencialRp.save(traslado);

      await this.createEstadoHistorial({
        trasladoId: body.trasladoId,
        tramoId: tramoActivo.id,
        estadoCode: traslado.estadoCode,
        observacion: isRedondo ? `Tramo de ida finalizado` : `Traslado finalizado`,
        qr,
        fechaRegistro: fechaHoraRecepcionInst,
      });

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      if (body?.recibidoPorFirmaImg) {
        deleteFile(`${LGC_TAS_LOCATIONS.firma}/${body.recibidoPorFirmaImg}`);
      }
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }

  public async getHistorialMonitoreo(
    trasladoId: number,
    vehiculoId: number,
    contextoCode: GcmContextCode
  ): Promise<any> {
    const qr = this.dynamicQR(gcmContextFactory(contextoCode));
    try {
      const tramo = await this.getActiveTramoOrFail(trasladoId, qr);
      await this.fetchAsignacionTramoActualConTripulacion(trasladoId, tramo.id, vehiculoId, qr);

      const signosVitalesRp = qr.manager.getRepository(TrasladoSignosVitalesOrm);
      const notasRp = qr.manager.getRepository(TrasladoNotaOrm);
      const procedimientoRp = qr.manager.getRepository(ProcedimientoOrm);
      const medicamentoRp = qr.manager.getRepository(MedicamentoOrm);

      const [signosVitales, notas, procedimientos, medicamentos] = await Promise.all([
        signosVitalesRp.find({
          where: { trasladoId, tramoId: tramo.id },
          order: { fecha: 'DESC' },
        }),
        notasRp.find({
          where: { trasladoId, tramoId: tramo.id },
          order: { fecha: 'DESC' },
        }),
        procedimientoRp.find({
          where: { trasladoId, tramoId: tramo.id },
          relations: ['procedimiento'],
          order: { fechaCreacion: 'DESC' },
        }),
        medicamentoRp.find({
          where: { trasladoId, tramoId: tramo.id },
          relations: ['medicamento'],
          order: { id: 'DESC' },
        }),
      ]);

      // Buscar procedimientos temporales en EKLIPSE
      const ekProcedimientoIds = this.uniqueNumbers(
        procedimientos.filter(p => p.ekprocedimientoId).map(p => p.ekprocedimientoId)
      );

      const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
      await ekQr.connect();

      let procedimientoTempMap = new Map<number, any>();
      if (ekProcedimientoIds.length > 0) {
        try {
          const procedimientoTempRp = ekQr.manager.getRepository(ProcedimientoTempOrm);
          const procedimientosTemp = await procedimientoTempRp.find({
            where: { id: In(ekProcedimientoIds) },
          });
          procedimientoTempMap = new Map(procedimientosTemp.map(p => [p.id, p]));
        } finally {
          await ekQr.release();
        }
      } else {
        await ekQr.release();
      }

      const userIdsByContexto = new Map<number, number[]>();

      for (const sv of signosVitales) {
        const ctx = sv.centroProcesamiento;
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(sv.usuarioId);
      }

      for (const n of notas) {
        const ctx = n.centroProcesamiento;
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(n.usuarioId);
      }

      for (const m of medicamentos) {
        const ctx = m.centroProcesamiento;
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(m.usuarioId);
      }

      for (const p of procedimientos) {
        const ctx = p.centroProcesamiento;
        if (!userIdsByContexto.has(ctx)) userIdsByContexto.set(ctx, []);
        userIdsByContexto.get(ctx).push(p.usuarioId);
      }

      const usuariosPorContexto = new Map<number, Map<number, UsuarioOrm>>();

      await Promise.all(
        Array.from(userIdsByContexto.entries()).map(async ([contexto, ids]) => {
          const usuarios = await this.findUsuarioByContexto(ids, contexto);
          usuariosPorContexto.set(contexto, new Map(usuarios.map(u => [u.id, u])));
        })
      );

      const findUser = (usuarioId: number, centroProcesamiento: number) => {
        const map = usuariosPorContexto.get(centroProcesamiento);
        return map?.get(usuarioId) ?? null;
      };

      // ── Formatear ──
      const formattedSignosVitales = signosVitales.map(sv => {
        const u = findUser(sv.usuarioId, sv.centroProcesamiento);
        return {
          id: sv.id,
          fechaCreacion: sv.fecha,
          momentoCode: sv.momentoCode,
          ta: sv.ta,
          fc: sv.fc,
          fr: sv.fr,
          sat: sv.sat,
          sato2: sv.sat,
          fcf: sv.fcf,
          temp: sv.temp,
          talla: sv.talla,
          peso: sv.peso,
          glasgow: sv.glasgow,
          observacion: sv.observacion,
          asignacionId: sv.asignacionId ?? null,
          usuario: u ? { id: u.id, nombre: u.nombreCompleto, documento: u.cedula } : 'Sistema',
        };
      });

      const formattedNotas = notas.map(n => {
        const u = findUser(n.usuarioId, n.centroProcesamiento);
        return {
          id: n.id,
          fechaCreacion: n.fecha,
          nota: n.nota,
          asignacionId: n.asignacionId ?? null,
          usuario: u ? { id: u.id, nombre: u.nombreCompleto, documento: u.cedula } : 'Sistema',
        };
      });

      const formattedProcedimientos = procedimientos.map(p => {
        const u = findUser(p.usuarioId, p.centroProcesamiento);
        const isTemporal = !!p.ekprocedimientoId;

        const procTemp = isTemporal ? procedimientoTempMap.get(p.ekprocedimientoId) : null;

        return {
          id: p.id,
          procedimientoId: p.procedimientoId,
          ekprocedimientoId: p.ekprocedimientoId ?? null,
          isTemporal,
          fechaCreacion: p.fechaCreacion,
          nombre: procTemp?.nombre ?? p.procedimiento?.nombre ?? 'Procedimiento',
          codigo: procTemp?.codigo ?? p.procedimiento?.codigo ?? 'N/A',
          asignacionId: p.asignacionId ?? null,
          usuario: u ? { id: u.id, nombre: u.nombreCompleto, documento: u.cedula } : 'Sistema',
        };
      });

      const formattedMedicamentos = medicamentos.map(m => {
        const u = findUser(m.usuarioId, m.centroProcesamiento);
        return {
          id: m.id,
          medicamentoId: m.medicamentoId,
          dosis: m.dosis,
          via: m.via,
          nombre: m.medicamento?.nombre ?? 'Medicamento',
          fechaCreacion: tramo.horaInicioRecorrido ?? new Date(),
          asignacionId: m.asignacionId ?? null,
          usuario: u ? { id: u.id, nombre: u.nombreCompleto, documento: u.cedula } : 'Sustituto',
        };
      });

      return {
        signosVitales: formattedSignosVitales,
        notas: formattedNotas,
        procedimientos: formattedProcedimientos,
        medicamentos: formattedMedicamentos,
      };
    } finally {
      await qr.release();
    }
  }

  public async createProcedimientosLista(body: CreateProcedimientosListaDto): Promise<number> {
    let transactionStarted = false;
    const qr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

    try {
      if (!body.codigo || !body.nombre) {
        throw new Error('Código y nombre son requeridos');
      }

      await qr.connect();
      await qr.startTransaction();
      transactionStarted = true;

      const procedimintoTempRp = qr.manager.getRepository(ProcedimientoTempOrm);

      const procedimientoRp = this.conn.getRepository(ServicioIpsOrm);

      const procedimientoTemp = await procedimintoTempRp.findOne({
        where: { codigo: body.codigo },
      });

      const procedimiento = await procedimientoRp.findOne({ where: { codigoCups: body.codigo } });

      if (procedimiento || procedimientoTemp) {
        throw new Error('Este procedimiento ya se encuentra registrado');
      }

      const newProcedimiento = procedimintoTempRp.create({
        tipo: 1,
        codigo: body.codigo,
        nombre: body.nombre,
      });

      await procedimintoTempRp.save(newProcedimiento);

      await qr.commitTransaction();
      return newProcedimiento.id;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }
}
