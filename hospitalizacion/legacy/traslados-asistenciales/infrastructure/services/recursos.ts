import { BadRequestException, Injectable } from '@nestjs/common';
import { TABLE_NAMES } from '@common/application/constants';
import { BaseSource } from '@common/infrastructure/services';
import {
  MedicamentoOrm,
  ProcedimientoOrm,
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoEstadoHistorialOrm,
  TrasladoSignosVitalesOrm,
  TrasladoTramoOrm,
  UbicacionOrm,
  PacienteTrasladoOrm,
  VehiculoOrm,
  EkEmpleadoOrm,
  TrasladoNotaOrm,
} from '@hpn/lgc/tas/orm/gcn';
import {
  EstadoAsistenciaTypeCode,
  ASISTENCIA_TIPOS,
  ESTADOS_ASISTENCIA,
  MotivoFallidoTypeCode,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import {
  AsignarTrasladoDto,
  CreateTrasladoPrimarioDto,
  CreateTrasladoSecundarioDto,
  EntregaMovilDto,
  MedicamentoDto,
  NotaDto,
  ProcedimientoItemDto,
  ReasignarTrasladoDto,
  SignosVitalesFlowDto,
} from '@hpn/lgc/tas/presentation/dtos';
import {
  EstadoPacienteCode,
  ESTADOS_PACIENTE,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales/estado-paciente';
import { TipoEmpleadoType, TIPOS_EMPLEADO, TIPOS_TRASLADO } from '@hpn/lgc/tas/types/gcn';
import { ALL_CONTEXTS_WITH_AUTHORITIES, GCM_CONTEXTS } from '@common/domain/types';
import { In, Not, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/old/general';

const TIPO_RECORRIDO_REDONDO = TIPOS_TRASLADO.REDONDO.getCode();

@Injectable()
export class RecursosCompartidosSource extends BaseSource {
  public getRealtimeContextCode() {
    return this.auth.context.getCode();
  }

  public ensureFlujoSecundario(traslado: TrasladoAsistencialOrm): void {
    if (traslado?.tipoCode === ASISTENCIA_TIPOS.PRIMARIO.getCode()) {
      throw new Error('Los traslados primarios no permiten esta accion del flujo secundario');
    }
  }

  public async findUsuarioByContexto(usuarioIds: number[], numericCode?: number) {
    const contexto = ALL_CONTEXTS_WITH_AUTHORITIES.find(c => c.getNumericCode() === numericCode);

    if (!contexto) {
      throw new Error(`No se encontro el contexto con codigo ${numericCode}`);
    }

    const ekConn = this.dynamicConn(contexto);

    const usuarioRp = ekConn.getRepository(UsuarioOrm);

    const usuarios = await usuarioRp.find({ where: { id: In(usuarioIds) } });

    if (usuarios.length === 0) {
      throw new Error(`No se encontro el empleado con id ${usuarioIds}`);
    }

    return usuarios;
  }

  public async pacienteConTrasladoActivo(body: {
    pacienteId?: number;
    pacienteTemporal?: CreateTrasladoPrimarioDto['pacienteTemporal'];
  }) {
    const pacienteTrasladoRp = this.qr.manager.getRepository(PacienteTrasladoOrm);
    const trasladoRp = this.qr.manager.getRepository(TrasladoAsistencialOrm);
    const estadosCerrados = [
      ESTADOS_ASISTENCIA.CANCELADO.getCode(),
      ESTADOS_ASISTENCIA.FINALIZADO.getCode(),
    ];

    let pacientesTraslado: Pick<PacienteTrasladoOrm, 'id'>[] = [];

    if (body.pacienteId) {
      pacientesTraslado = await pacienteTrasladoRp.find({
        where: { pacienteId: body.pacienteId },
        select: ['id'],
      });
    } else if (body.pacienteTemporal?.numeroDocumento?.trim()) {
      pacientesTraslado = await pacienteTrasladoRp.find({
        where: {
          numeroDocumento: body.pacienteTemporal.numeroDocumento.trim(),
          tipoDocumentoCode: body.pacienteTemporal.tipoDocumentoCode,
        },
        select: ['id'],
      });
    }

    const pacientesTrasladoIds = pacientesTraslado.map(paciente => paciente.id);

    if (!pacientesTrasladoIds.length) {
      return;
    }

    const trasladoActivo = await trasladoRp.findOne({
      where: {
        pacienteId: In(pacientesTrasladoIds),
        estadoCode: Not(In(estadosCerrados)),
        isDeleted: false,
      },
      order: { id: 'DESC' },
    });

    if (trasladoActivo) {
      throw new Error(
        `El paciente ya tiene un traslado activo (${trasladoActivo.id}) y no se puede crear otro hasta finalizarlo o cancelarlo`
      );
    }
  }

  public signosVitalesCompletos(body: EntregaMovilDto) {
    const signosVitales = body?.signosVitales;

    if (!signosVitales) {
      throw new Error('No se pueden entregar pacientes sin signos vitales registrados');
    }

    const requiredNumericFields: Array<keyof typeof signosVitales> = [
      'fc',
      'fr',
      'sato2',
      'fcf',
      'glasgow',
    ];

    if (typeof signosVitales.ta !== 'string' || !signosVitales.ta.trim()) {
      throw new Error('El campo ta de signosVitales es obligatorio');
    }

    for (const field of requiredNumericFields) {
      const value = signosVitales[field];

      if (value === null || value === undefined || Number.isNaN(value)) {
        throw new Error(`El campo ${String(field)} de signosVitales es obligatorio`);
      }
    }
  }

  public async createPacienteExistente(
    body: CreateTrasladoSecundarioDto
  ): Promise<PacienteTrasladoOrm> {
    const trasladoPacienteRp = this.qr.manager.getRepository(PacienteTrasladoOrm);

    if (!body.pacienteId) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal');
    }

    await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, body.pacienteId);

    if (body.pacienteId) {
      const paciente = await trasladoPacienteRp.findOne({ where: { pacienteId: body.pacienteId } });
      if (paciente) return paciente;
      return trasladoPacienteRp.save(
        trasladoPacienteRp.create({
          pacienteId: body.pacienteId,
        })
      );
    }
  }

  public async createPacientePrimario(
    body: CreateTrasladoPrimarioDto
  ): Promise<PacienteTrasladoOrm> {
    const trasladoPacienteRp = this.qr.manager.getRepository(PacienteTrasladoOrm);

    /*    if (body.pacienteId) {
      await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, body.pacienteId);

      const paciente = await trasladoPacienteRp.findOne({ where: { pacienteId: body.pacienteId } });
      if (paciente) return paciente;

      return trasladoPacienteRp.save(
        trasladoPacienteRp.create({
          pacienteId: body.pacienteId,
        })
      );
    } */

    if (!body.pacienteTemporal) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal');
    }

    const numeroDocumento = body.pacienteTemporal.numeroDocumento?.trim();
    const pacienteTemporalExistente = await trasladoPacienteRp.findOne({
      where: {
        numeroDocumento,
        tipoDocumentoCode: body.pacienteTemporal.tipoDocumentoCode,
      },
    });

    if (pacienteTemporalExistente) {
      return pacienteTemporalExistente;
    }

    return trasladoPacienteRp.save(
      trasladoPacienteRp.create({
        nombre: body.pacienteTemporal.nombre,
        apellido: body.pacienteTemporal.apellido,
        tipoDocumentoCode: body.pacienteTemporal.tipoDocumentoCode,
        numeroDocumento,
        edad: body.pacienteTemporal.edad,
        generoCode: body.pacienteTemporal.generoCode,
        grupoSanguineoCode: body.pacienteTemporal.grupoSanguineoCode,
        eps: body.pacienteTemporal.eps,
        arl: body.pacienteTemporal.arl,
        soat: body.pacienteTemporal.soat,
      })
    );
  }

  public async resolveUbicacion(body: CreateTrasladoSecundarioDto['origen']): Promise<{
    origenId: number | null;
    ekOrigenId: number | null;
  }> {
    const ubicacionRp = this.qr.manager.getRepository(UbicacionOrm);

    // Es una institución existente
    if (body.id > 0) {
      await this.verifyEntityExist('GEENENTADM', body.id);

      return {
        origenId: body.id,
        ekOrigenId: null,
      };
    }

    // Es una ubicación nueva
    const ubicacion = await ubicacionRp.save(
      ubicacionRp.create({
        nombre: body.nombre,
        direccion: body.direccion,
        departamentoId: +body.departamentoId,
        municipioId: +body.municipioId,
      })
    );

    return {
      origenId: null,
      ekOrigenId: ubicacion.id,
    };
  }

  public buildTramos(body: CreateTrasladoSecundarioDto) {
    if (body.tipoRecorridoCode === TIPO_RECORRIDO_REDONDO) {
      return [
        {
          orden: 1,
          tipoTramoCode: 1,
          origen: body.origen,
          destino: body.destino,
        },
        {
          orden: 2,
          tipoTramoCode: 2,
          origen: body.destino,
          destino: body.origen,
        },
      ];
    }

    return [
      {
        orden: 1,
        tipoTramoCode: 1,
        origen: body.origen,
        destino: body.destino,
      },
    ];
  }

  public getAsignacionActual(asignaciones?: TrasladoAsignacionOrm[]): TrasladoAsignacionOrm | null {
    if (!asignaciones?.length) return null;

    const activa = asignaciones.find(asignacion => !!asignacion?.isActiva);
    if (activa) return activa;

    return (
      [...asignaciones].sort((a, b) => {
        const fechaA = a?.fechaAsignacion ? new Date(a.fechaAsignacion).getTime() : 0;
        const fechaB = b?.fechaAsignacion ? new Date(b.fechaAsignacion).getTime() : 0;
        if (fechaA !== fechaB) return fechaB - fechaA;
        return (b?.id ?? 0) - (a?.id ?? 0);
      })[0] ?? null
    );
  }

  public enrichAsignacion(
    asignacion: TrasladoAsignacionOrm,
    vehiculoMap: Map<number, VehiculoOrm>,
    empleadoMap: Map<number, EkEmpleadoOrm>
  ) {
    if (!asignacion) return null;

    const vehiculo = vehiculoMap.get(asignacion.vehiculoId);
    const conductor = empleadoMap.get(asignacion.conductorId);
    const auxiliar = empleadoMap.get(asignacion.auxiliarId);
    const medico = empleadoMap.get(asignacion.medicoId);

    return {
      trasladoId: asignacion.trasladoId,
      tramoId: asignacion.tramoId,
      vehiculo: vehiculo
        ? { id: vehiculo.id, codigo: vehiculo.placa, nombre: vehiculo.placa }
        : null,
      conductor: conductor
        ? { id: conductor.id, nombre: conductor.nombre, documento: conductor.documento }
        : null,
      auxiliar: auxiliar
        ? { id: auxiliar.id, nombre: auxiliar.nombre, documento: auxiliar.documento }
        : null,
      medico: medico ? { id: medico.id, nombre: medico.nombre, documento: medico.documento } : null,
    };
  }

  public uniqueNumbers(values: Array<number | null | undefined>): number[] {
    return [
      ...new Set(
        values.filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
      ),
    ];
  }

  public uniqueStrings(values: Array<string | null | undefined>): string[] {
    return [...new Set(values.filter((value): value is string => !!value?.trim()))];
  }

  public getAuthDocument(): string | null {
    const auth: any = this.auth;
    const rawDocument =
      auth?.user?.document ?? auth?.user?.cedula ?? auth?.user?.username ?? auth?.documento ?? null;
    if (!rawDocument) return null;
    return `${rawDocument}`.trim();
  }

  public async fetchAsignacionTramoActualConTripulacion(
    trasladoId: number,
    tramoId: number,
    vehiculoId: number,
    qr?: QueryRunner
  ): Promise<any> {
    const connQr = qr ? qr : this.qr;
    const asignacionRp = connQr.manager.getRepository(TrasladoAsignacionOrm);
    const authDocument = this.getAuthDocument();
    const asignacion = await asignacionRp.findOne({
      where: {
        trasladoId,
        tramoId,
        isActiva: true,
      },
      order: { fechaAsignacion: 'DESC', id: 'DESC' },
    });

    if (!asignacion) {
      throw new Error(
        `No existe una asignacion activa para el tramo actual del traslado ${trasladoId}`
      );
    }

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    await ekQr.connect();
    try {
      const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
      const empleadoRp = ekQr.manager.getRepository(EkEmpleadoOrm);

      const [vehiculo, conductor, auxiliar, medico] = await Promise.all([
        vehiculoRp.findOne({ where: { id: asignacion.vehiculoId } }),
        empleadoRp.findOne({ where: { id: asignacion.conductorId } }),
        empleadoRp.findOne({ where: { id: asignacion.auxiliarId } }),
        asignacion.medicoId
          ? empleadoRp.findOne({ where: { id: asignacion.medicoId } })
          : Promise.resolve(null),
      ]);

      const documentoAutenticado = `${authDocument ?? ''}`.trim();
      const documentosAsignados = [conductor?.documento, auxiliar?.documento, medico?.documento]
        .filter(Boolean)
        .map(documento => `${documento}`.trim());

      if (!documentoAutenticado || !documentosAsignados.includes(documentoAutenticado)) {
        throw new Error(
          'El usuario autenticado no corresponde al conductor, auxiliar o medico asignado al tramo actual'
        );
      }

      if (vehiculo.id !== vehiculoId) {
        throw new Error('La placa enviada no corresponde al vehiculo asignado al tramo actual');
      }

      return {
        trasladoId,
        tramoId,
        asignacionId: asignacion.id,
        vehiculo: {
          id: asignacion.vehiculoId,
          placa: vehiculo?.placa ?? null,
        },
        conductor: conductor
          ? {
              id: conductor.id,
              nombre: conductor.nombre,
              documento: conductor.documento,
            }
          : null,
        auxiliar: auxiliar
          ? {
              id: auxiliar.id,
              nombre: auxiliar.nombre,
              documento: auxiliar.documento,
            }
          : null,
        medico: medico
          ? {
              id: medico.id,
              nombre: medico.nombre,
              documento: medico.documento,
            }
          : null,
      };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    } finally {
      await ekQr.release();
    }
  }

  public async getTrasladoOrFail(
    trasladoId: number,
    qr?: QueryRunner,
    withLock: boolean = false
  ): Promise<TrasladoAsistencialOrm> {
    const connQr = qr ? qr : this.qr;
    const options: any = {
      where: { id: trasladoId, isDeleted: false },
    };
    if (withLock) {
      options.lock = { mode: 'pessimistic_write' };
    }
    const traslado = await connQr.manager.getRepository(TrasladoAsistencialOrm).findOne(options);

    if (!traslado) {
      throw new Error(`No existe traslado con id ${trasladoId} o se encuentra eliminado`);
    }

    if (traslado.estadoCode === ESTADOS_ASISTENCIA.CANCELADO.getCode()) {
      throw new Error(`El traslado con n${trasladoId} se encuentra cancelado`);
    }

    return traslado;
  }

  protected async resolveTramoOrFail(
    trasladoId: number,
    tramoId?: number,
    qr?: QueryRunner
  ): Promise<TrasladoTramoOrm> {
    const connQr = qr ? qr : this.qr;
    const tramoRp = connQr.manager.getRepository(TrasladoTramoOrm);
    const tramo = tramoId
      ? await tramoRp.findOne({ where: { id: tramoId, trasladoId } })
      : await this.getActiveTramoOrFail(trasladoId, qr);

    if (!tramo) {
      throw new Error(`El tramo ${tramoId} no pertenece al traslado ${trasladoId}`);
    }

    return tramo;
  }

  public async getActiveTramoOrFail(
    trasladoId: number,
    qr?: QueryRunner
  ): Promise<TrasladoTramoOrm> {
    const connQr = qr ? qr : this.qr;
    const tramo = await connQr.manager.getRepository(TrasladoTramoOrm).findOne({
      where: { trasladoId, isActivo: true },
      order: { orden: 'ASC', id: 'ASC' },
    });

    if (!tramo) {
      throw new Error(`No existe un tramo activo para el traslado ${trasladoId}`);
    }

    return tramo;
  }

  public async getNextTramo(
    trasladoId: number,
    currentOrden: number,
    qr?: QueryRunner
  ): Promise<TrasladoTramoOrm | null> {
    const connQr = qr ? qr : this.qr;
    return connQr.manager.getRepository(TrasladoTramoOrm).findOne({
      where: { trasladoId, orden: currentOrden + 1 },
      order: { orden: 'ASC', id: 'ASC' },
    });
  }

  public resolveEstadoPacienteCode(value: string): EstadoPacienteCode {
    const normalized = `${value ?? ''}`.trim().toUpperCase();

    if (!normalized) {
      throw new Error('El estadoPaciente es obligatorio');
    }

    if (normalized === `${ESTADOS_PACIENTE.VIVO.getCode()}` || normalized === 'VIVO') {
      return ESTADOS_PACIENTE.VIVO.getCode();
    }

    if (normalized === `${ESTADOS_PACIENTE.MUERTO.getCode()}` || normalized === 'MUERTO') {
      return ESTADOS_PACIENTE.MUERTO.getCode();
    }

    throw new Error('estadoPaciente debe ser VIVO o MUERTO');
  }

  public async resolveAssignmentResources(
    body: AsignarTrasladoDto | ReasignarTrasladoDto,
    ekQr: any
  ) {
    const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
    const empleadoRp = ekQr.manager.getRepository(EkEmpleadoOrm);

    const [vehiculo, conductor, auxiliar, medico] = await Promise.all([
      vehiculoRp.findOne({ where: { id: body.vehiculoId } }),
      this.findOrCreateEkEmpleado(empleadoRp, body.conductor, TIPOS_EMPLEADO.CONDUCTOR),
      this.findOrCreateEkEmpleado(empleadoRp, body.auxiliar, TIPOS_EMPLEADO.AUXILIAR),
      body.medico
        ? this.findOrCreateEkEmpleado(empleadoRp, body.medico, TIPOS_EMPLEADO.MEDICO)
        : Promise.resolve(null),
    ]);

    return { vehiculo, conductor, auxiliar, medico };
  }

  public async findOrCreateEkEmpleado(
    empleadoRp: any,
    payload: { id?: number; nombre?: string; documento?: string },
    tipo: TipoEmpleadoType
  ): Promise<EkEmpleadoOrm> {
    if (!payload) {
      throw new Error(`${tipo.getForHumans()} es obligatorio`);
    }

    let empleado: EkEmpleadoOrm = null;

    /*   if (payload.id) {
        empleado = await empleadoRp.findOne({ where: { id: payload.id } });
      } */

    if (payload.documento) {
      empleado = await empleadoRp.findOne({ where: { documento: payload.documento } });
    }

    if (empleado) return empleado;

    if (!payload.nombre || !payload.documento) {
      throw new Error(`Debe enviar nombre y documento para ${tipo.getForHumans()}`);
    }

    const newEnt = new EkEmpleadoOrm();
    newEnt.nombre = payload.nombre;
    newEnt.documento = payload.documento;
    newEnt.tipoCode = tipo.getCode();

    return empleadoRp.save(newEnt);
  }

  public ensureTrasladoPrimario(body: CreateTrasladoPrimarioDto) {
    const hasPacienteId = !!body.pacienteId;
    const hasPacienteTemporal = !!body.pacienteTemporal;

    if (!body.notas.length) {
      throw new Error('El traslado debe tener al menos una nota');
    }

    if (!hasPacienteId && !hasPacienteTemporal) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal');
    }

    if (hasPacienteId && hasPacienteTemporal) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal, pero no ambos');
    }

    if (hasPacienteTemporal) {
      this.ensurePacienteTemporal(body.pacienteTemporal);
    }

    if (body.kmInicial === null || body.kmInicial === undefined || body.kmInicial < 0) {
      throw new Error('kmInicial debe ser mayor o igual a cero');
    }

    if (body.kmFinal === null || body.kmFinal === undefined || body.kmFinal < 0) {
      throw new Error('kmFinal debe ser mayor o igual a cero');
    }

    if (body.kmFinal <= body.kmInicial) {
      throw new Error('kmFinal debe ser mayor que kmInicial');
    }

    if (!body.bodyMapImageName?.trim()) {
      throw new Error('bodyMapImageName es obligatorio');
    }

    if (!body.recibidoPorFirmaImg?.trim()) {
      throw new Error('recibidoPorFirmaImg es obligatorio');
    }

    if (!body.recibidoPorNombre?.trim()) {
      throw new Error('recibidoPorNombre es obligatorio');
    }

    if (!body.recibidoPorDocumento?.trim()) {
      throw new Error('recibidoPorDocumento es obligatorio');
    }

    const operationalDates = [
      body.solicitadoEl,
      body.despachoHora,
      body.llegadaEscenaHora,
      body.salidaEscenaHora,
      body.llegadaInstitucionHora,
      body.recepcionInstitucionHora,
    ];

    const toSafeDate = (value?: string): Date | null => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    for (const value of operationalDates) {
      const date = new Date(value);
      if (!value || Number.isNaN(date.getTime())) {
        throw new Error('Los tiempos operacionales deben ser fechas validas');
      }
      if (date.getTime() > Date.now()) {
        throw new Error('Los tiempos operacionales no pueden ser futuros');
      }
    }

    const despachoHora = toSafeDate(body.despachoHora);
    const solicitadoEl = toSafeDate(body.solicitadoEl);
    const llegadaEscena = toSafeDate(body.llegadaEscenaHora);
    const salidaEscena = toSafeDate(body.salidaEscenaHora);
    const llegadaInstitucion = toSafeDate(body.llegadaInstitucionHora);
    const recepcionInstitucion = toSafeDate(body.recepcionInstitucionHora);

    if (llegadaEscena && despachoHora && llegadaEscena.getTime() < despachoHora.getTime()) {
      throw new Error('La llegada a escena no puede ser anterior a la hora de despacho');
    }

    if (llegadaEscena && solicitadoEl && llegadaEscena.getTime() < solicitadoEl.getTime()) {
      throw new Error('La llegada a escena no puede ser anterior a la hora de solicitud');
    }

    if (llegadaEscena && salidaEscena && salidaEscena.getTime() < llegadaEscena.getTime()) {
      throw new Error('La salida de escena no puede ser anterior a la llegada a escena');
    }

    if (
      salidaEscena &&
      llegadaInstitucion &&
      llegadaInstitucion.getTime() < salidaEscena.getTime()
    ) {
      throw new Error('La llegada a la institución no puede ser anterior a la salida de escena');
    }

    if (
      llegadaInstitucion &&
      recepcionInstitucion &&
      recepcionInstitucion.getTime() < llegadaInstitucion.getTime()
    ) {
      throw new Error(
        'La recepción en la institución no puede ser anterior a la llegada del paciente'
      );
    }

    for (const item of [
      ...(body.procedimientos ?? []),
      ...(body.medicamentos ?? []),
      ...(body.notas ?? []),
    ]) {
      const date = new Date(item.fechaHoraRegistro);
      if (!item.fechaHoraRegistro || Number.isNaN(date.getTime())) {
        throw new Error('fechaHoraRegistro es obligatoria y debe ser una fecha valida');
      }
      if (date.getTime() > Date.now()) {
        throw new Error('fechaHoraRegistro no puede ser futura');
      }
      if (llegadaEscena && date.getTime() < llegadaEscena.getTime()) {
        throw new Error('El registro no puede ser anterior a la hora de llegada a escena');
      }
    }

    if (!body.signosVitales || !toSafeDate(body.signosVitales.fechaRegistro)) {
      throw new Error(
        'La fechaRegistro de signos vitales es obligatoria y debe ser una fecha valida'
      );
    }

    const svFechaRegistro = toSafeDate(body.signosVitales.fechaRegistro);

    if (svFechaRegistro && svFechaRegistro.getTime() > Date.now()) {
      throw new Error('La fechaRegistro de signos vitales no puede ser futura');
    }

    if (llegadaEscena && svFechaRegistro && svFechaRegistro.getTime() < llegadaEscena.getTime()) {
      throw new Error(
        'La fechaRegistro de signos vitales no puede ser anterior a la hora de llegada a escena'
      );
    }

    if (!body.vehiculoId) {
      throw new Error('vehiculoId es obligatorio para la asignacion inicial');
    }

    if (!body.conductor?.nombre?.trim() || !body.conductor?.documento?.trim()) {
      throw new Error('conductor es obligatorio para la asignacion inicial');
    }

    if (!body.auxiliar?.nombre?.trim() || !body.auxiliar?.documento?.trim()) {
      throw new Error('auxiliar es obligatorio para la asignacion inicial');
    }
  }

  public ensurePacienteTemporal(pacienteTemporal: CreateTrasladoPrimarioDto['pacienteTemporal']) {
    if (!pacienteTemporal) {
      throw new Error('Debe enviar la informacion del paciente temporal');
    }

    if (!pacienteTemporal.nombre?.trim()) {
      throw new Error('El nombre del paciente temporal es obligatorio');
    }

    if (!pacienteTemporal.apellido?.trim()) {
      throw new Error('El apellido del paciente temporal es obligatorio');
    }

    if (!pacienteTemporal.tipoDocumentoCode) {
      throw new Error('El tipoDocumentoCode del paciente temporal es obligatorio');
    }

    if (!pacienteTemporal.numeroDocumento?.trim()) {
      throw new Error('El numeroDocumento del paciente temporal es obligatorio');
    }

    if (pacienteTemporal.edad === null || pacienteTemporal.edad === undefined) {
      throw new Error('La edad del paciente temporal es obligatoria');
    }

    if (pacienteTemporal.generoCode === null || pacienteTemporal.generoCode === undefined) {
      throw new Error('El generoCode del paciente temporal es obligatorio');
    }

    if (
      pacienteTemporal.grupoSanguineoCode === null ||
      pacienteTemporal.grupoSanguineoCode === undefined
    ) {
      throw new Error('El grupoSanguineoCode del paciente temporal es obligatorio');
    }

    if (!pacienteTemporal.eps?.trim()) {
      throw new Error('La eps del paciente temporal es obligatoria');
    }

    if (!pacienteTemporal.arl?.trim()) {
      throw new Error('La arl del paciente temporal es obligatoria');
    }

    if (!pacienteTemporal.soat?.trim()) {
      throw new Error('El soat del paciente temporal es obligatorio');
    }
  }

  public async createSignosVitales(
    trasladoId: number,
    tramoId: number,
    signosVitales: SignosVitalesFlowDto,
    momentoCode = 1,
    qr?: QueryRunner,
    asignacionId?: number
  ) {
    if (!signosVitales) return;

    qr = qr ?? this.qr;

    const signo = signosVitales;

    const fechaRegistro = signo.fechaRegistro ? new Date(signo.fechaRegistro) : new Date();

    const signosRp = qr.manager.getRepository(TrasladoSignosVitalesOrm);
    await signosRp.save(
      signosRp.create({
        trasladoId,
        tramoId,
        momentoCode,
        asignacionId,
        usuarioId: this.auth.id,
        fc: signo.fc,
        fr: signo.fr,
        ta: signo.ta,
        sat: signo.sato2,
        fcf: signo.fcf,
        temp: signo.temp,
        talla: signo.talla,
        peso: signo.peso,
        glasgow: signo.glasgow,
        observacion: signo.observacion,
        fecha: new Date(),
        fechaRegistro: fechaRegistro,
        centroProcesamiento: this.auth.context.getNumericCode(),
      })
    );
  }

  public async createInitialAssignment(
    trasladoId: number,
    tramoId: number,
    body: CreateTrasladoPrimarioDto
  ) {
    if (!body.vehiculoId) return;

    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);

    let conductor: EkEmpleadoOrm, auxiliar: EkEmpleadoOrm, medico: EkEmpleadoOrm;

    try {
      const empleadoRp = ekQr.manager.getRepository(EkEmpleadoOrm);
      const vehiculoRp = ekQr.manager.getRepository(VehiculoOrm);
      const vehiculo = await vehiculoRp.findOne({ where: { id: body.vehiculoId } });

      if (!vehiculo) {
        throw new Error(`El vehiculo con id ${body.vehiculoId} no existe`);
      }

      if (body.auxiliar) {
        auxiliar = await empleadoRp.findOne({ where: { documento: body.auxiliar.documento } });
        if (!auxiliar) {
          const newEnt = new EkEmpleadoOrm();
          newEnt.nombre = body.auxiliar.nombre;
          newEnt.documento = body.auxiliar.documento;
          newEnt.tipoCode = TIPOS_EMPLEADO.AUXILIAR.getCode();
          auxiliar = await empleadoRp.save(newEnt);
        }
      }
      if (body.conductor) {
        conductor = await empleadoRp.findOne({ where: { documento: body.conductor.documento } });
        if (!conductor) {
          const newEnt = new EkEmpleadoOrm();
          newEnt.nombre = body.conductor.nombre;
          newEnt.documento = body.conductor.documento;
          newEnt.tipoCode = TIPOS_EMPLEADO.CONDUCTOR.getCode();
          conductor = await empleadoRp.save(newEnt);
        }
      }

      if (body.medico) {
        medico = await empleadoRp.findOne({ where: { documento: body.medico.documento } });
        if (!medico) {
          const newEnt = new EkEmpleadoOrm();
          newEnt.nombre = body.medico.nombre;
          newEnt.documento = body.medico.documento;
          newEnt.tipoCode = TIPOS_EMPLEADO.MEDICO.getCode();
          medico = await empleadoRp.save(newEnt);
        }
      }
    } catch (error: any) {
      throw new BadRequestException(error.message);
    } finally {
      await ekQr.release();
    }

    if (!conductor?.id || !auxiliar?.id) {
      throw new BadRequestException('No se puede crear la asignación sin conductor y auxiliar');
    }

    const asignacionRp = this.qr.manager.getRepository(TrasladoAsignacionOrm);
    return await asignacionRp.save(
      asignacionRp.create({
        trasladoId,
        tramoId,
        vehiculoId: body.vehiculoId,
        conductorId: conductor.id,
        auxiliarId: auxiliar.id,
        medicoId: medico?.id,
        asignadoPorId: this.auth.id,
        estadoCode: ESTADOS_ASISTENCIA.ASIGNADO.getCode(),
        //motivo: body.observacion,
        fechaAsignacion: new Date(),
        isActiva: true,
        centroProcesamiento: this.auth.context.getNumericCode(),
      })
    );
  }

  public async createProcedimientos(
    trasladoId: number,
    tramoId: number,
    procedimientos?: ProcedimientoItemDto[],
    qr?: QueryRunner,
    asignacionId?: number
  ) {
    if (!procedimientos?.length) return;

    qr = qr ?? this.qr;

    const procedimientoRp = qr.manager.getRepository(ProcedimientoOrm);

    for (const procedimiento of procedimientos) {
      const fechaRegistro = procedimiento.fechaHoraRegistro
        ? new Date(procedimiento.fechaHoraRegistro)
        : new Date();
      await procedimientoRp.save(
        procedimientoRp.create({
          trasladoId,
          tramoId,
          usuarioId: this.auth.id,
          procedimientoId: procedimiento.isTemporal ? null : procedimiento.id,
          ekprocedimientoId: procedimiento.isTemporal ? procedimiento.id : null,
          fechaCreacion: new Date(),
          fechaRegistro: fechaRegistro,
          centroProcesamiento: this.auth.context.getNumericCode(),
          asignacionId,
        })
      );
    }
  }

  public async createMedicamentos(
    trasladoId: number,
    tramoId: number,
    medicamentos?: MedicamentoDto[],
    qr?: QueryRunner,
    asignacionId?: number
  ) {
    if (!medicamentos?.length) return;

    qr = qr ?? this.qr;

    const medicamentoRp = qr.manager.getRepository(MedicamentoOrm);
    for (const medicamento of medicamentos) {
      const fechaRegistro = medicamento.fechaHoraRegistro
        ? new Date(medicamento.fechaHoraRegistro)
        : new Date();
      await medicamentoRp.save(
        medicamentoRp.create({
          trasladoId,
          usuarioId: this.auth.id,
          tramoId,
          asignacionId,
          medicamentoId: medicamento.id,
          dosis: medicamento.dosis,
          via: medicamento.via,
          fechaCreacion: new Date(),
          fechaRegistro: fechaRegistro,
          centroProcesamiento: this.auth.context.getNumericCode(),
        })
      );
    }
  }

  public async createNotas(
    trasladoId: number,
    tramoId: number,
    notas?: NotaDto[],
    qr?: QueryRunner,
    asignacionId?: number
  ) {
    if (!notas?.length) return;

    qr = qr ?? this.qr;

    const notaRp = qr.manager.getRepository(TrasladoNotaOrm);

    for (const nota of notas) {
      const fechaRegistro = nota.fechaHoraRegistro ? new Date(nota.fechaHoraRegistro) : new Date();
      await notaRp.save(
        notaRp.create({
          trasladoId,
          tramoId,
          asignacionId,
          usuarioId: this.auth.id,
          fecha: new Date(),
          nota: nota.nota,
          fechaRegistro: fechaRegistro,
          centroProcesamiento: this.auth.context.getNumericCode(),
        })
      );
    }
  }

  /* Falta agregar el centro que lo hace */

  public async createEstadoHistorial(payload: {
    trasladoId: number;
    tramoId: number | null;
    estadoCode: EstadoAsistenciaTypeCode;
    observacion?: string;
    motivoCancelacionCode?: MotivoFallidoTypeCode;
    qr?: QueryRunner;
    fechaRegistro?: Date;
  }) {
    const qr = payload.qr ?? this.qr;
    const { trasladoId, tramoId, estadoCode, observacion, motivoCancelacionCode } = payload;
    const historialRp = qr.manager.getRepository(TrasladoEstadoHistorialOrm);
    const fechaRegistro = payload.fechaRegistro ?? new Date();

    await historialRp.save(
      historialRp.create({
        trasladoId,
        tramoId,
        estadoCode,
        usuarioId: this.auth.id,
        observacion,
        motivoCancelacionCode,
        fecha: new Date(),
        fechaRegistro: fechaRegistro,
        centroProcesamiento: this.auth.context.getNumericCode(),
      })
    );
  }

  public validateDocumentosUnicos(...personas: Array<{ documento?: string } | undefined>): void {
    const documentos = personas.filter(p => p?.documento).map(p => p.documento);

    if (new Set(documentos).size !== documentos.length) {
      throw new Error('Todos los integrantes asignados deben ser personas diferentes.');
    }
  }

  public buildTrasladoQuery(
    rp: Repository<TrasladoAsistencialOrm>
  ): SelectQueryBuilder<TrasladoAsistencialOrm> {
    return (
      rp
        .createQueryBuilder('t')

        .leftJoinAndSelect('t.usuario', 'usuario')

        .leftJoinAndSelect('t.paciente', 'paciente')
        .leftJoinAndSelect('paciente.detalleContrato', 'detalleContrato')

        .leftJoinAndSelect('t.ekPaciente', 'ekPaciente')
        .leftJoinAndSelect('t.asignaciones', 'asignaciones')
        .leftJoinAndSelect('t.servicioRequerido', 'servicioRequerido')

        .leftJoinAndSelect('t.tramos', 'tramos')

        // Origen
        .leftJoinAndSelect('tramos.origen', 'origen')
        .leftJoinAndSelect('origen.tercero', 'origenTercero')
        .leftJoinAndSelect('origenTercero.municipio', 'origenMunicipio')
        .leftJoinAndSelect('origenTercero.direccion', 'origenDireccion')
        .leftJoinAndSelect('origenMunicipio.departamento', 'origenDepartamento')

        // Destino
        .leftJoinAndSelect('tramos.destino', 'destino')
        .leftJoinAndSelect('destino.tercero', 'destinoTercero')
        .leftJoinAndSelect('destinoTercero.municipio', 'destinoMunicipio')
        .leftJoinAndSelect('destinoTercero.direccion', 'destinoDireccion')
        .leftJoinAndSelect('destinoMunicipio.departamento', 'destinoDepartamento')
        // Ubicaciones creadas en EK
        .leftJoinAndSelect('tramos.ekOrigen', 'ekOrigen')
        .leftJoinAndSelect('ekOrigen.municipio', 'ekOrigenMunicipio')
        .leftJoinAndSelect('ekOrigen.departamento', 'ekOrigenDepartamento')

        .leftJoinAndSelect('tramos.ekDestino', 'ekDestino')
        .leftJoinAndSelect('ekDestino.municipio', 'ekDestinoMunicipio')
        .leftJoinAndSelect('ekDestino.departamento', 'ekDestinoDepartamento')

        .andWhere('t.ISDELETE = 0')
    );
  }
}
