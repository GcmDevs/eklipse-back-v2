import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
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
  ProductoOrm,
  MedicamentoPrevioOrm,
  TrasladoAccidenteOrm,
  TrasladoVehiculoInvolucradoOrm,
} from '@hpn/lgc/tas/orm/gcn';
import {
  EstadoAsistenciaTypeCode,
  ASISTENCIA_TIPOS,
  ESTADOS_ASISTENCIA,
  MotivoFallidoTypeCode,
  CONDICIONES_CLINICAS_CODES,
  ACCIDENTE_TRANSITO,
  MOTIVO_TRASLADO_PRIM_VALUES,
  AREA_RECOGIDA,
  OTRO,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import {
  AsignarTrasladoDto,
  CreatePrimarioSegmentadoDto,
  CreateTrasladoPrimarioDto,
  CreateTrasladoSecundarioDto,
  EntregaMovilDto,
  FinalizarPrimarioSegmentadoDto,
  MedicamentoDto,
  NotaDto,
  ProcedimientoItemDto,
  ReasignarTrasladoDto,
  SignosVitalesFlowDto,
  UpdatePrimarioUbicacionDto,
  VehiculoInvolucradoDto,
} from '@hpn/lgc/tas/presentation/dtos';
import {
  EstadoPacienteCode,
  ESTADOS_PACIENTE,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales/estado-paciente';
import { TipoEmpleadoType, TIPOS_EMPLEADO, TIPOS_TRASLADO } from '@hpn/lgc/tas/types/gcn';
import { ALL_CONTEXTS_WITH_AUTHORITIES, GCM_CONTEXTS } from '@common/domain/types';
import { In, Not, QueryRunner, Repository, SelectQueryBuilder } from 'typeorm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/old/general';
import { SeccionPendienteFinalizacion } from '../../application/responses/pri-seg';
import { TrasladoValidator } from '../../application/validators';
import { esFechaNacimientoValida } from '../../application/helpers/fecha-nacimiento';

const TIPO_RECORRIDO_REDONDO = TIPOS_TRASLADO.REDONDO.getCode();

@Injectable()
export class RecursosCompartidosSource extends BaseSource {
  protected readonly validator = new TrasladoValidator();

  protected async inTransaction<T>(operation: () => Promise<T>): Promise<T> {
    let started = false;
    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      started = true;
      const result = await operation();
      await this.qr.commitTransaction();
      return result;
    } catch (error: any) {
      if (started && this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error.message);
    } finally {
      if (!this.qr.isReleased) await this.qr.release();
    }
  }

  public getRealtimeContextCode() {
    return this.auth.context.getCode();
  }

  public ensureFlujoSecundario(traslado: TrasladoAsistencialOrm): void {
    this.validator.ensureFlujoSecundario(traslado);
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
    pacienteTemporal?: Pick<
      CreateTrasladoPrimarioDto['pacienteTemporal'],
      'numeroDocumento' | 'tipoDocumentoCode'
    >;
  }) {
    const pacienteTrasladoRp = this.conn.getRepository(PacienteTrasladoOrm);
    const trasladoRp = this.conn.getRepository(TrasladoAsistencialOrm);
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
    this.validator.signosVitalesCompletos(body);
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
        fechaNacimiento: body.pacienteTemporal.fechaNacimiento,
        generoCode: body.pacienteTemporal.generoCode,
        grupoSanguineoCode: body.pacienteTemporal.grupoSanguineoCode,
        eps: body.pacienteTemporal.eps,
        arl: body.pacienteTemporal.arl,
        /* soat: body.pacienteTemporal.soat, */
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

    if (!normalized) throw new Error('El estadoPaciente es obligatorio');

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

  public ensureTrasladoPrimario(body: CreateTrasladoPrimarioDto): void {
    this.validator.ensureTrasladoPrimario(body);
  }

  public ensurePacienteTemporal(
    pacienteTemporal: Omit<CreateTrasladoPrimarioDto['pacienteTemporal'], 'soat'> & {
      soat?: string;
    },
    exigirSoat = true
  ) {
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

    if (!esFechaNacimientoValida(pacienteTemporal.fechaNacimiento)) {
      throw new Error('La fecha de nacimiento debe ser válida, no futura y no superar los 150 años');
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

    if (exigirSoat && !pacienteTemporal.soat?.trim()) {
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
    return signosRp.save(
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
        fechaDesasignacion: new Date(),
        isActiva: false,
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
    if (!procedimientos?.length) return [];

    qr = qr ?? this.qr;

    const procedimientoRp = qr.manager.getRepository(ProcedimientoOrm);

    const created: ProcedimientoOrm[] = [];
    for (const procedimiento of procedimientos) {
      const fechaRegistro = procedimiento.fechaHoraRegistro
        ? new Date(procedimiento.fechaHoraRegistro)
        : new Date();
      created.push(
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
        )
      );
    }
    return created;
  }

  public async createMedicamentos(
    trasladoId: number,
    tramoId: number,
    medicamentos?: MedicamentoDto[],
    qr?: QueryRunner,
    asignacionId?: number
  ) {
    if (!medicamentos?.length) return [];

    qr = qr ?? this.qr;

    const medicamentoRp = qr.manager.getRepository(MedicamentoOrm);
    const created: MedicamentoOrm[] = [];
    for (const medicamento of medicamentos) {
      const fechaRegistro = medicamento.fechaHoraRegistro
        ? new Date(medicamento.fechaHoraRegistro)
        : new Date();
      created.push(
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
        )
      );
    }
    return created;
  }

  public async createNotas(
    trasladoId: number,
    tramoId: number,
    notas?: NotaDto[],
    qr?: QueryRunner,
    asignacionId?: number
  ) {
    if (!notas?.length) return [];

    qr = qr ?? this.qr;

    const notaRp = qr.manager.getRepository(TrasladoNotaOrm);

    const created: TrasladoNotaOrm[] = [];
    for (const nota of notas) {
      const fechaRegistro = nota.fechaHoraRegistro ? new Date(nota.fechaHoraRegistro) : new Date();
      created.push(
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
        )
      );
    }
    return created;
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
        .leftJoin('t.accidente', 'accidenteDisponibilidad')
        .addSelect('accidenteDisponibilidad.id')

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

  public buildTrasladoDetailBaseQuery(
    rp: Repository<TrasladoAsistencialOrm>
  ): SelectQueryBuilder<TrasladoAsistencialOrm> {
    return rp
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.usuario', 'usuario')
      .leftJoinAndSelect('t.paciente', 'paciente')
      .leftJoinAndSelect('paciente.detalleContrato', 'detalleContrato')
      .leftJoinAndSelect('t.ekPaciente', 'ekPaciente')
      .leftJoinAndSelect('t.servicioRequerido', 'servicioRequerido')
      .leftJoinAndSelect('t.tramos', 'tramos')
      .leftJoinAndSelect('tramos.origen', 'origen')
      .leftJoinAndSelect('origen.tercero', 'origenTercero')
      .leftJoinAndSelect('origenTercero.municipio', 'origenMunicipio')
      .leftJoinAndSelect('origenTercero.direccion', 'origenDireccion')
      .leftJoinAndSelect('origenMunicipio.departamento', 'origenDepartamento')
      .leftJoinAndSelect('tramos.destino', 'destino')
      .leftJoinAndSelect('destino.tercero', 'destinoTercero')
      .leftJoinAndSelect('destinoTercero.municipio', 'destinoMunicipio')
      .leftJoinAndSelect('destinoTercero.direccion', 'destinoDireccion')
      .leftJoinAndSelect('destinoMunicipio.departamento', 'destinoDepartamento')
      .leftJoinAndSelect('tramos.ekOrigen', 'ekOrigen')
      .leftJoinAndSelect('ekOrigen.municipio', 'ekOrigenMunicipio')
      .leftJoinAndSelect('ekOrigen.departamento', 'ekOrigenDepartamento')
      .leftJoinAndSelect('tramos.ekDestino', 'ekDestino')
      .leftJoinAndSelect('ekDestino.municipio', 'ekDestinoMunicipio')
      .leftJoinAndSelect('ekDestino.departamento', 'ekDestinoDepartamento')
      .where('t.ISDELETE = 0');
  }

  public async createMedicamentosPrevios(
    trasladoId: number,
    medicamentos: CreateTrasladoPrimarioDto['medicamentosPrevios']
  ): Promise<void> {
    const medicamentoIds = [
      ...new Set(
        medicamentos
          .map(medicamento => medicamento.medicamentoId)
          .filter((id): id is number => id !== null && id !== undefined)
      ),
    ];

    if (medicamentoIds.length) {
      const productos = await this.qr.manager.getRepository(ProductoOrm).find({
        where: {
          id: In(medicamentoIds),
          tipoProducto: 2,
        },
      });
      const productosEncontrados = new Set(productos.map(producto => producto.id));
      const idsInvalidos = medicamentoIds.filter(id => !productosEncontrados.has(id));

      if (idsInvalidos.length) {
        throw new Error(`No existen medicamentos validos para los IDs: ${idsInvalidos.join(', ')}`);
      }
    }

    const medicamentoPrevioRp = this.qr.manager.getRepository(MedicamentoPrevioOrm);

    await medicamentoPrevioRp.save(
      medicamentos.map(medicamento =>
        medicamentoPrevioRp.create({
          trasladoId,
          medicamentoId: medicamento.medicamentoId,
          descripcion: medicamento.descripcion?.trim(),
          fechaCreacion: new Date(),
        })
      )
    );
  }

  public validateOperationalDates(body: {
    solicitadoEl: string;
    despachoHora: string;
    llegadaEscenaHora: string;
    salidaEscenaHora: string;
  }): void {
    const solicitado = new Date(body.solicitadoEl);
    const despacho = new Date(body.despachoHora);
    const llegada = new Date(body.llegadaEscenaHora);
    const salida = new Date(body.salidaEscenaHora);
    const dates = [solicitado, despacho, llegada, salida];

    if (dates.some(date => Number.isNaN(date.getTime()))) {
      throw new Error('Los tiempos operacionales deben ser fechas validas');
    }
    if (dates.some(date => date.getTime() > Date.now())) {
      throw new Error('Los tiempos operacionales no pueden ser futuros');
    }
    if (despacho < solicitado || llegada < despacho || salida < llegada) {
      throw new Error('Los tiempos operacionales no conservan el orden esperado');
    }
  }

  public async resolvePaciente(
    body: Pick<CreatePrimarioSegmentadoDto, 'pacienteId' | 'pacienteTemporal'>
  ): Promise<{ pacienteId: number | null; ekPacienteId: number | null }> {
    const hasPacienteId = !!body.pacienteId;
    const hasTemporal = !!body.pacienteTemporal;
    if (hasPacienteId === hasTemporal) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal, pero no ambos');
    }

    if (body.pacienteId) {
      await this.verifyEntityExist(TABLE_NAMES.gen.pct.pacientes, body.pacienteId);
      return { pacienteId: body.pacienteId, ekPacienteId: null };
    }

    this.ensurePacienteTemporal(body.pacienteTemporal, false);
    const pacienteRp = this.qr.manager.getRepository(PacienteTrasladoOrm);
    const numeroDocumento = body.pacienteTemporal.numeroDocumento.trim();
    const existente = await pacienteRp.findOne({
      where: { numeroDocumento, tipoDocumentoCode: body.pacienteTemporal.tipoDocumentoCode },
    });
    const datos = {
      ...body.pacienteTemporal,
      numeroDocumento,
      estadoCivilCode: body.pacienteTemporal.estadoCivilCode,
      direccion: body.pacienteTemporal.direccion.trim(),
      barrio: body.pacienteTemporal.barrio.trim(),
      celular: body.pacienteTemporal.celular.trim(),
    };
    // Reutiliza el paciente por documento y actualiza sus datos, sin crear duplicados ni borrar SOAT.
    const paciente = await pacienteRp.save(pacienteRp.create({ ...existente, ...datos }));
    return { pacienteId: null, ekPacienteId: paciente.id };
  }

  public async getPrimarioPropioOrFail(
    trasladoId: number,
    withLock = false
  ): Promise<TrasladoAsistencialOrm> {
    const traslado = await this.qr.manager.getRepository(TrasladoAsistencialOrm).findOne({
      where: {
        id: trasladoId,
        tipoCode: ASISTENCIA_TIPOS.PRIMARIO.getCode(),
        usuarioId: this.auth.id,
        isDeleted: false,
      },
      ...(withLock ? { lock: { mode: 'pessimistic_write' as const } } : {}),
    });

    if (!traslado) {
      throw new Error(`No existe traslado primario con id ${trasladoId}`);
    }
    return traslado;
  }

  public async getPrimarioEditableOrFail(trasladoId: number): Promise<TrasladoAsistencialOrm> {
    const traslado = await this.getPrimarioPropioOrFail(trasladoId, true);
    this.ensureEditable(traslado);
    return traslado;
  }

  public async getTramoPrincipalOrFail(trasladoId: number): Promise<TrasladoTramoOrm> {
    const tramo = await this.qr.manager
      .getRepository(TrasladoTramoOrm)
      .findOne({ where: { trasladoId, orden: 1 } });

    if (!tramo) {
      throw new Error(`No existe el tramo principal del traslado ${trasladoId}`);
    }
    return tramo;
  }

  public ensureEditable(traslado: TrasladoAsistencialOrm): void {
    this.validator.ensureEditable(traslado);
  }

  public ensureAccident(traslado: TrasladoAsistencialOrm): void {
    this.validator.ensureAccident(traslado);
  }

  public validateFechaRegistro(value: string, descripcion: string, fechaMinima?: Date): void {
    this.validator.validateFechaRegistro(value, descripcion, fechaMinima);
  }

  public async getOrCreateAccident(trasladoId: number): Promise<TrasladoAccidenteOrm> {
    const repository = this.qr.manager.getRepository(TrasladoAccidenteOrm);
    const current = await repository.findOne({ where: { trasladoId } });
    return current ?? repository.save(repository.create({ trasladoId, fechaCreacion: new Date() }));
  }

  public validateFechaClinicaSegmentado(
    value: string,
    descripcion: string,
    tramo: TrasladoTramoOrm
  ): void {
    this.validator.validateFechaClinicaSegmentado(value, descripcion, tramo);
  }

  public isMissing(value: unknown): boolean {
    return this.validator.isMissing(value);
  }

  public isValidDate(value: unknown): value is Date | string {
    return this.validator.isValidDate(value);
  }

  public isNumberInRange(value: unknown, minimum: number, maximum: number): boolean {
    return this.validator.isNumberInRange(value, minimum, maximum);
  }

  public addPending(
    pendientes: SeccionPendienteFinalizacion[],
    seccion: string,
    campo: string,
    mensaje: string
  ): void {
    this.validator.addPending(pendientes, seccion, campo, mensaje);
  }

  public async validarSeccionesParaFinalizar(
    traslado: TrasladoAsistencialOrm,
    tramo: TrasladoTramoOrm,
    body: FinalizarPrimarioSegmentadoDto,
    signatureName?: string
  ): Promise<SeccionPendienteFinalizacion[]> {
    const pendientes: SeccionPendienteFinalizacion[] = [];
    const trasladoId = traslado.id;
    const [
      signos,
      notas,
      medicamentosPrevios,
      asignacionActiva,
      accidente,
      procedimientos,
      medicamentos,
    ] = await Promise.all([
      this.qr.manager
        .getRepository(TrasladoSignosVitalesOrm)
        .find({ where: { trasladoId }, select: ['id', 'fechaRegistro'] }),
      this.qr.manager
        .getRepository(TrasladoNotaOrm)
        .find({ where: { trasladoId }, select: ['id', 'fechaRegistro'] }),
      this.qr.manager.getRepository(MedicamentoPrevioOrm).count({ where: { trasladoId } }),
      this.qr.manager.getRepository(TrasladoAsignacionOrm).findOne({
        where: { trasladoId, isActiva: true },
        order: { fechaAsignacion: 'DESC', id: 'DESC' },
      }),
      this.qr.manager.getRepository(TrasladoAccidenteOrm).findOne({
        where: { trasladoId },
        relations: ['vehiculos'],
      }),
      this.qr.manager
        .getRepository(ProcedimientoOrm)
        .find({ where: { trasladoId }, select: ['id', 'fechaRegistro'] }),
      this.qr.manager
        .getRepository(MedicamentoOrm)
        .find({ where: { trasladoId }, select: ['id', 'fechaRegistro'] }),
    ]);

    if (!traslado.centroId) {
      this.addPending(pendientes, 'paciente', 'centroId', 'Falta el centro');
    }
    if (traslado.ekPacienteId && !traslado.pacienteId) {
      const pacienteManual = await this.qr.manager
        .getRepository(PacienteTrasladoOrm)
        .findOne({ where: { id: traslado.ekPacienteId } });
      if (![0, 1, 2, 3, 4, 5].includes(pacienteManual?.estadoCivilCode)) {
        this.addPending(
          pendientes,
          'paciente',
          'estadoCivilCode',
          'Falta seleccionar el estado civil'
        );
      }
      for (const [campo, mensaje] of [
        ['direccion', 'Falta la dirección del paciente'],
        ['barrio', 'Falta el barrio del paciente'],
        ['celular', 'Falta el celular del paciente'],
      ] as const) {
        if (this.isMissing(pacienteManual?.[campo]))
          this.addPending(pendientes, 'paciente', campo, mensaje);
      }
    }
    if (!traslado.cupsCode) {
      this.addPending(pendientes, 'paciente', 'cupsCode', 'Falta el CUPS');
    }
    const tienePaciente = !!traslado.pacienteId;
    const tienePacienteTemporal = !!traslado.ekPacienteId;
    if (tienePaciente === tienePacienteTemporal) {
      this.addPending(
        pendientes,
        'paciente',
        'paciente',
        tienePaciente
          ? 'El traslado no puede tener paciente normal y temporal al mismo tiempo'
          : 'Falta el paciente'
      );
    }
    const motivoValido = MOTIVO_TRASLADO_PRIM_VALUES.some(
      motivo => motivo.getCode() === traslado.tipoRemisionCode
    );
    if (!motivoValido) {
      this.addPending(pendientes, 'paciente', 'tipoRemisionCode', 'Falta un motivo valido');
    }
    if (traslado.tipoRemisionCode === OTRO.getCode() && this.isMissing(traslado.otroTipoRemision)) {
      this.addPending(pendientes, 'paciente', 'otroTipoRemision', 'Falta describir el otro motivo');
    }

    const tiemposOperativos = [
      ['horaSolicitud', tramo.horaSolicitud],
      ['horaDespacho', tramo.horaDespacho],
      ['horaLlegadaEscena', tramo.horaLlegadaEscena],
      ['horaSalidaEscena', tramo.horaSalidaEscena],
    ] as const;
    tiemposOperativos.forEach(([campo, value]) => {
      if (!this.isValidDate(value)) {
        this.addPending(pendientes, 'paciente', campo, `Falta una fecha valida para ${campo}`);
      }
    });
    if (tiemposOperativos.every(([, value]) => this.isValidDate(value))) {
      const [solicitud, despacho, llegadaEscena, salidaEscena] = tiemposOperativos.map(
        ([, value]) => new Date(value).getTime()
      );
      if (
        [solicitud, despacho, llegadaEscena, salidaEscena].some(value => value > Date.now()) ||
        despacho < solicitud ||
        llegadaEscena < despacho ||
        salidaEscena < llegadaEscena
      ) {
        this.addPending(
          pendientes,
          'paciente',
          'tiemposOperativos',
          'Los tiempos operativos son futuros o no conservan el orden esperado'
        );
      }
    }

    if (!tramo.origenId && !tramo.ekOrigenId) {
      this.addPending(pendientes, 'ubicacion', 'origen', 'Falta el lugar de recogida');
    }
    if (!tramo.destinoId && !tramo.ekDestinoId) {
      this.addPending(pendientes, 'ubicacion', 'destino', 'Falta el lugar de destino');
    }

    if (!traslado.diagnosticoId) {
      this.addPending(pendientes, 'diagnostico', 'diagnosticoId', 'Falta el diagnostico principal');
    }
    if (this.isMissing(traslado.hallazgos)) {
      this.addPending(pendientes, 'diagnostico', 'hallazgos', 'Faltan los hallazgos clinicos');
    }
    if (
      typeof traslado.triageCode !== 'number' ||
      traslado.triageCode < 1 ||
      traslado.triageCode > 5
    ) {
      this.addPending(pendientes, 'diagnostico', 'triageCode', 'Falta un TRIAGE valido');
    }
    if (this.isMissing(traslado.triageImg)) {
      this.addPending(pendientes, 'diagnostico', 'triageImg', 'Falta el mapa corporal');
    }

    if (!signos.length) {
      this.addPending(
        pendientes,
        'atencion',
        'signosVitales',
        'Falta al menos un registro de signos vitales'
      );
    }
    if (!notas.length) {
      this.addPending(pendientes, 'atencion', 'notas', 'Falta al menos una nota clinica');
    }

    if (!this.isMissing(traslado.condicionClinica)) {
      const condiciones = traslado.condicionClinica
        .split(',')
        .map(value => Number(value.trim()))
        .filter(value => !Number.isNaN(value));
      if (
        !condiciones.length ||
        condiciones.some(codigo => !CONDICIONES_CLINICAS_CODES.includes(codigo as any))
      ) {
        this.addPending(
          pendientes,
          'condicion',
          'condicionClinica',
          'Las condiciones clinicas no son validas'
        );
      }
      if (
        !this.isValidDate(traslado.fechaHoraVistoBien) ||
        new Date(traslado.fechaHoraVistoBien).getTime() > Date.now() ||
        (this.isValidDate(tramo.horaSolicitud) &&
          new Date(traslado.fechaHoraVistoBien) < new Date(tramo.horaSolicitud))
      ) {
        this.addPending(
          pendientes,
          'condicion',
          'fechaHoraVistoBien',
          'Falta una fecha valida de ultima vez visto bien'
        );
      }
      if (typeof traslado.prenotificaAlSitio !== 'boolean') {
        this.addPending(
          pendientes,
          'condicion',
          'prenotificaAlSitio',
          'Falta indicar la prenotificacion'
        );
      }
      if (!medicamentosPrevios) {
        this.addPending(
          pendientes,
          'condicion',
          'medicamentosPrevios',
          'Falta al menos un medicamento previo'
        );
      }
    }

    if (!asignacionActiva) {
      this.addPending(pendientes, 'tripulacion', 'asignacionActiva', 'Falta una asignacion activa');
    } else {
      if (!asignacionActiva.vehiculoId) {
        this.addPending(pendientes, 'tripulacion', 'vehiculoId', 'Falta la ambulancia');
      }
      if (!asignacionActiva.conductorId) {
        this.addPending(pendientes, 'tripulacion', 'conductorId', 'Falta el conductor');
      }
      if (!asignacionActiva.auxiliarId) {
        this.addPending(pendientes, 'tripulacion', 'auxiliarId', 'Falta el auxiliar');
      }
    }

    if (traslado.tipoRemisionCode === ACCIDENTE_TRANSITO.getCode()) {
      if (!accidente || this.isMissing(accidente.area)) {
        this.addPending(pendientes, 'ubicacion', 'area', 'Falta seleccionar el area');
      }
      if (!accidente || !this.isNumberInRange(accidente.latitudOrigen, -90, 90)) {
        this.addPending(pendientes, 'ubicacion', 'latitudOrigen', 'Falta una latitud valida');
      }
      if (!accidente || !this.isNumberInRange(accidente.longitudOrigen, -180, 180)) {
        this.addPending(pendientes, 'ubicacion', 'longitudOrigen', 'Falta una longitud valida');
      }
      if (!accidente || this.isMissing(accidente.barrioOrigen)) {
        this.addPending(pendientes, 'ubicacion', 'barrioOrigen', 'Falta el barrio del origen');
      }
      if (!accidente || this.isMissing(accidente.referenciaOrigen)) {
        this.addPending(
          pendientes,
          'ubicacion',
          'referenciaOrigen',
          'Falta la referencia adicional'
        );
      }
      if (accidente?.area === AREA_RECOGIDA.RURAL.getCode()) {
        if (this.isMissing(accidente.veredaOrigen)) {
          this.addPending(
            pendientes,
            'ubicacion',
            'veredaOrigen',
            'Falta el corregimiento o vereda'
          );
        }
        if (this.isMissing(accidente.viaOrigen)) {
          this.addPending(pendientes, 'ubicacion', 'viaOrigen', 'Falta la via o tramo');
        }
        if (this.isMissing(accidente.kilometroOrigen)) {
          this.addPending(
            pendientes,
            'ubicacion',
            'kilometroOrigen',
            'Falta el kilometro o referencia vial'
          );
        }
      }

      if (!accidente || this.isMissing(accidente.codigoCrue)) {
        this.addPending(pendientes, 'escena', 'codigoCrue', 'Falta el codigo CRUE');
      }
      if (!accidente || this.isMissing(accidente.entidadDespacho)) {
        this.addPending(pendientes, 'escena', 'entidadDespacho', 'Falta la entidad que despacho');
      }
      if (!accidente || typeof accidente.escenaSegura !== 'boolean') {
        this.addPending(
          pendientes,
          'escena',
          'escenaSegura',
          'Falta indicar si la escena es segura'
        );
      }
      if (!accidente?.mecanismoCode) {
        this.addPending(pendientes, 'escena', 'mecanismoCode', 'Falta el tipo de mecanismo');
      }
      if (!accidente || this.isMissing(accidente.quejaPrincipal)) {
        this.addPending(pendientes, 'escena', 'quejaPrincipal', 'Falta la queja principal');
      }

      if (!traslado.servicioRequeridoId) {
        this.addPending(
          pendientes,
          'entrega',
          'servicioRequeridoId',
          'Falta el servicio requerido'
        );
      }
      if (!accidente || this.isMissing(accidente.relato)) {
        this.addPending(
          pendientes,
          'entrega',
          'relato',
          'Falta el relato de la entrega del paciente'
        );
      }
      if (typeof accidente?.pertenenciasEntregadas !== 'boolean') {
        this.addPending(
          pendientes,
          'entrega',
          'pertenenciasEntregadas',
          'Falta indicar si se entregaron pertenencias'
        );
      }
      if (!accidente || typeof accidente.custodia !== 'boolean') {
        this.addPending(pendientes, 'entrega', 'custodia', 'Falta indicar la cadena de custodia');
      }
      if (
        !accidente ||
        !['paciente', 'familiar'].includes(accidente.consentimientoOtorgadoPor?.trim())
      ) {
        this.addPending(
          pendientes,
          'entrega',
          'consentimientoOtorgadoPor',
          'Falta indicar quien otorga el consentimiento'
        );
      }

      (accidente?.vehiculos ?? []).forEach((vehiculo, index) => {
        const prefix = `vehiculos[${index}]`;
        if (typeof vehiculo.fuga !== 'boolean') {
          this.addPending(pendientes, 'vehiculos', `${prefix}.fuga`, 'Falta indicar la fuga');
        }
        if (typeof vehiculo.noIdentificado !== 'boolean') {
          this.addPending(
            pendientes,
            'vehiculos',
            `${prefix}.noIdentificado`,
            'Falta indicar si el vehiculo esta identificado'
          );
        }
        if (this.isMissing(vehiculo.tipo)) {
          this.addPending(pendientes, 'vehiculos', `${prefix}.tipo`, 'Falta el tipo de vehiculo');
        }
        if (vehiculo.noIdentificado === false && this.isMissing(vehiculo.placa)) {
          this.addPending(
            pendientes,
            'vehiculos',
            `${prefix}.placa`,
            'Falta la placa o marcar el vehiculo como no identificado'
          );
        }
      });

      (tramo.archivos ?? []).forEach((archivo, index) => {
        const prefix = `evidencias[${index}]`;
        if (this.isMissing(archivo.nombre)) {
          this.addPending(
            pendientes,
            'evidencias',
            `${prefix}.nombre`,
            'Falta el nombre de la evidencia'
          );
        }
        if (this.isMissing(archivo.ruta)) {
          this.addPending(
            pendientes,
            'evidencias',
            `${prefix}.ruta`,
            'Falta la ruta de la evidencia'
          );
        }
        if (!archivo.categoria || !['sitio', 'vehiculo'].includes(archivo.categoria)) {
          this.addPending(
            pendientes,
            'evidencias',
            `${prefix}.categoria`,
            'La categoria de la evidencia no es valida'
          );
        }
      });
    }

    const llegada = new Date(body.llegadaInstitucionHora);
    const recepcion = new Date(body.recepcionInstitucionHora);
    const gruposClinicos = [
      ['signosVitales', 'signos vitales', signos],
      ['notas', 'nota clínica', notas],
      ['procedimientos', 'procedimiento', procedimientos],
      ['medicamentos', 'medicamento', medicamentos],
    ] as const;
    for (const [campo, nombre, registros] of gruposClinicos) {
      for (const registro of registros) {
        const fecha = new Date(registro.fechaRegistro);
        if (
          !this.isValidDate(registro.fechaRegistro) ||
          fecha.getTime() > Date.now() ||
          (!this.isValidDate(tramo.horaLlegadaEscena) || fecha < new Date(tramo.horaLlegadaEscena)) ||
          (this.isValidDate(body.recepcionInstitucionHora) && fecha > recepcion)
        ) {
          this.addPending(
            pendientes,
            'atencion',
            campo,
            `El registro de ${nombre} #${registro.id} tiene una fecha inválida o fuera del rango entre llegada a escena y recepción institucional`
          );
        }
      }
    }
    if (!this.isValidDate(body.llegadaInstitucionHora)) {
      this.addPending(
        pendientes,
        'finalizacion',
        'llegadaInstitucionHora',
        'Falta una hora valida de llegada a la institucion'
      );
    }
    if (!this.isValidDate(body.recepcionInstitucionHora)) {
      this.addPending(
        pendientes,
        'finalizacion',
        'recepcionInstitucionHora',
        'Falta una hora valida de recepcion institucional'
      );
    }
    if (
      this.isValidDate(body.llegadaInstitucionHora) &&
      this.isValidDate(body.recepcionInstitucionHora) &&
      (llegada.getTime() > Date.now() ||
        recepcion.getTime() > Date.now() ||
        (this.isValidDate(tramo.horaSalidaEscena) && llegada < tramo.horaSalidaEscena) ||
        recepcion < llegada)
    ) {
      this.addPending(
        pendientes,
        'finalizacion',
        'tiemposFinales',
        'Las fechas de llegada y recepcion son futuras o no conservan el orden esperado'
      );
    }
    if (typeof body.kmInicial !== 'number' || body.kmInicial < 0) {
      this.addPending(
        pendientes,
        'finalizacion',
        'kmInicial',
        'Falta un kilometraje inicial valido'
      );
    }
    if (typeof body.kmFinal !== 'number' || body.kmFinal < 0) {
      this.addPending(pendientes, 'finalizacion', 'kmFinal', 'Falta un kilometraje final valido');
    } else if (typeof body.kmInicial === 'number' && body.kmFinal <= body.kmInicial) {
      this.addPending(
        pendientes,
        'finalizacion',
        'kmFinal',
        'El kilometraje final debe ser mayor que el inicial'
      );
    }
    if (
      ![ESTADOS_PACIENTE.VIVO.getCode(), ESTADOS_PACIENTE.MUERTO.getCode()].includes(
        body.estadoPacienteCode
      )
    ) {
      this.addPending(
        pendientes,
        'finalizacion',
        'estadoPacienteCode',
        'Falta un estado valido del paciente'
      );
    }
    if (this.isMissing(body.recibidoPorNombre)) {
      this.addPending(
        pendientes,
        'finalizacion',
        'recibidoPorNombre',
        'Falta el nombre del funcionario receptor'
      );
    }
    if (this.isMissing(body.recibidoPorDocumento)) {
      this.addPending(
        pendientes,
        'finalizacion',
        'recibidoPorDocumento',
        'Falta el documento del funcionario receptor'
      );
    }
    if (this.isMissing(signatureName ?? body.recibidoPorFirmaImg)) {
      this.addPending(
        pendientes,
        'finalizacion',
        'recibidoPorFirmaImg',
        'Falta la firma del funcionario receptor'
      );
    }

    return pendientes;
  }

  public async getAccidenteOrFail(trasladoId: number): Promise<TrasladoAccidenteOrm> {
    const accidente = await this.qr.manager
      .getRepository(TrasladoAccidenteOrm)
      .findOne({ where: { trasladoId } });
    if (!accidente) {
      throw new Error(`El traslado ${trasladoId} no tiene informacion de accidente`);
    }
    return accidente;
  }

  public async getVehiculoOrFail(accidenteId: number, vehiculoId: number) {
    const vehiculo = await this.qr.manager
      .getRepository(TrasladoVehiculoInvolucradoOrm)
      .findOne({ where: { id: vehiculoId, accidenteId } });
    if (!vehiculo) {
      throw new Error(`El vehiculo involucrado ${vehiculoId} no pertenece al traslado`);
    }
    return vehiculo;
  }

  public validateVehiculo(body: VehiculoInvolucradoDto): void {
    this.validator.validateVehiculo(body);
  }

  public async getTripulanteAutenticado(
    ekQr: any
  ): Promise<{ empleado: EkEmpleadoOrm; rol: 'MEDICO' | 'AUXILIAR' }> {
    const documento = this.getAuthDocument();
    if (!documento) {
      throw new Error('No fue posible identificar el documento del usuario autenticado');
    }

    const empleado = await ekQr.manager.getRepository(EkEmpleadoOrm).findOne({
      where: { documento },
    });
    if (!empleado) {
      throw new Error(
        `El usuario autenticado con documento ${documento} no esta registrado en HPNGTCENTIDAD`
      );
    }

    if (empleado.tipoCode === TIPOS_EMPLEADO.MEDICO.getCode()) {
      return { empleado, rol: 'MEDICO' };
    }
    if (empleado.tipoCode === TIPOS_EMPLEADO.AUXILIAR.getCode()) {
      return { empleado, rol: 'AUXILIAR' };
    }

    throw new Error(
      'El usuario autenticado debe estar registrado como medico o auxiliar para gestionar un traslado primario'
    );
  }

  public async fetchTripulanteAutenticado() {
    const ekQr = this.dynamicQR(GCM_CONTEXTS.EKLIPSE);
    await ekQr.connect();
    try {
      const { empleado, rol } = await this.getTripulanteAutenticado(ekQr);
      return {
        habilitado: true,
        id: empleado.id,
        nombre: empleado.nombre,
        documento: empleado.documento,
        tipoCode: empleado.tipoCode,
        rol,
      };
    } finally {
      await ekQr.release();
    }
  }


    public async resolveUbicacionSegmentada(
      body: UpdatePrimarioUbicacionDto['origen'],
      tramo: TrasladoTramoOrm,
      tipo: 'origen' | 'destino'
    ): Promise<{ origenId: number | null; ekOrigenId: number | null }> {
      const ubicacionId = tipo === 'origen' ? tramo.ekOrigenId : tramo.ekDestinoId;
      if (body.id > 0 || !ubicacionId) return this.resolveUbicacion(body);
  
      // El ID procede del tramo autorizado, nunca del formulario enviado por el usuario.
      const ubicacionRp = this.qr.manager.getRepository(UbicacionOrm);
      const ubicacion = await ubicacionRp.findOneOrFail({
        where: { id: ubicacionId },
        lock: { mode: 'pessimistic_write' },
      });
      const datos = {
        nombre: body.nombre,
        direccion: body.direccion,
        departamentoId: +body.departamentoId,
        municipioId: +body.municipioId,
      };
      const cambio =
        ubicacion.nombre !== datos.nombre ||
        ubicacion.direccion !== datos.direccion ||
        ubicacion.departamentoId !== datos.departamentoId ||
        ubicacion.municipioId !== datos.municipioId;
      if (cambio) {
        const otroExtremoId = tipo === 'origen' ? tramo.ekDestinoId : tramo.ekOrigenId;
        const compartida =
          otroExtremoId === ubicacionId ||
          (await this.qr.manager.getRepository(TrasladoTramoOrm).exist({
            where: [
              { ekOrigenId: ubicacionId, id: Not(tramo.id) },
              { ekDestinoId: ubicacionId, id: Not(tramo.id) },
            ],
          }));
        if (compartida) {
          throw new Error(
            `La ubicación manual de ${tipo} está compartida con otro tramo o extremo. No se puede modificar sin afectar esa información.`
          );
        }
        await ubicacionRp.save(Object.assign(ubicacion, datos));
      }
      return { origenId: null, ekOrigenId: ubicacionId };
    }
}
