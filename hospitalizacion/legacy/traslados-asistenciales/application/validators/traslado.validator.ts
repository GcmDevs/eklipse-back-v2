import type {
  CreateTrasladoPrimarioDto,
  EntregaMovilDto,
  VehiculoInvolucradoDto,
} from '@hpn/lgc/tas/presentation/dtos';
import {
  ACCIDENTE_TRANSITO,
  ASISTENCIA_TIPOS,
  CONDICIONES_CLINICAS_CODES,
  ESTADOS_ASISTENCIA,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { SeccionPendienteFinalizacion } from '../responses/pri-seg';
import { esFechaNacimientoValida } from '../helpers/fecha-nacimiento';

interface TrasladoValidable {
  tipoCode?: number;
  estadoCode?: number;
  tipoRemisionCode?: number;
}

interface TramoClinicoValidable {
  horaSalidaEscena?: Date;
  horaRecepcionInst?: Date;
}

export class TrasladoValidator {
  public ensureFlujoSecundario(traslado: TrasladoValidable): void {
    if (traslado?.tipoCode === ASISTENCIA_TIPOS.PRIMARIO.getCode()) {
      throw new Error('Los traslados primarios no permiten esta accion del flujo secundario');
    }
  }

  public signosVitalesCompletos(body: EntregaMovilDto): void {
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

  public ensureTrasladoPrimario(body: CreateTrasladoPrimarioDto): void {
    const hasPacienteId = !!body.pacienteId;
    const hasPacienteTemporal = !!body.pacienteTemporal;
    const condicionesClinicas = body.tiposCondicionClinicaCodes ?? [];
    const tieneCondicionClinica = condicionesClinicas.length > 0;

    if (body.tiposCondicionClinicaCodes && !tieneCondicionClinica) {
      throw new Error('tiposCondicionClinicaCodes debe tener al menos una condición clínica');
    }
    if (new Set(condicionesClinicas).size !== condicionesClinicas.length) {
      throw new Error('tiposCondicionClinicaCodes no puede contener códigos repetidos');
    }

    if (tieneCondicionClinica) {
      if (typeof body.prenotificaAlSitio !== 'boolean') {
        throw new Error('prenotificaAlSitio es obligatorio cuando existe una condición clínica');
      }
      if (condicionesClinicas.some(codigo => !CONDICIONES_CLINICAS_CODES.includes(codigo))) {
        throw new Error('tiposCondicionClinicaCodes debe corresponder al catálogo vigente');
      }

      const fechaVistoBien = body.fechaHoraVistoBienPaciente
        ? new Date(body.fechaHoraVistoBienPaciente)
        : null;
      if (!fechaVistoBien || Number.isNaN(fechaVistoBien.getTime())) {
        throw new Error(
          'fechaHoraVistoBienPaciente es obligatoria cuando existe una condición clínica'
        );
      }
      if (fechaVistoBien.getTime() > Date.now()) {
        throw new Error('fechaHoraVistoBienPaciente no puede ser futura');
      }
      if (!Array.isArray(body.medicamentosPrevios) || !body.medicamentosPrevios.length) {
        throw new Error(
          'El traslado primario debe tener al menos un medicamento previo cuando existe una condición clínica'
        );
      }
      body.medicamentosPrevios.forEach((medicamento, index) => {
        const hasMedicamentoId =
          Number.isInteger(medicamento?.medicamentoId) && medicamento.medicamentoId > 0;
        const hasDescripcion = !!medicamento?.descripcion?.trim();
        if (!hasMedicamentoId && !hasDescripcion) {
          throw new Error(
            `El medicamento previo ${index + 1} debe tener medicamentoId, descripcion o ambos`
          );
        }
      });
    }

    if (!body.notas.length) throw new Error('El traslado debe tener al menos una nota');
    if (!hasPacienteId && !hasPacienteTemporal) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal');
    }
    if (hasPacienteId && hasPacienteTemporal) {
      throw new Error('Debe enviar pacienteId o pacienteTemporal, pero no ambos');
    }
    if (hasPacienteTemporal) this.ensurePacienteTemporal(body.pacienteTemporal);

    if (body.kmInicial === null || body.kmInicial === undefined || body.kmInicial < 0) {
      throw new Error('kmInicial debe ser mayor o igual a cero');
    }
    if (body.kmFinal === null || body.kmFinal === undefined || body.kmFinal < 0) {
      throw new Error('kmFinal debe ser mayor o igual a cero');
    }
    if (body.kmFinal <= body.kmInicial) throw new Error('kmFinal debe ser mayor que kmInicial');
    if (!body.bodyMapImageName?.trim()) throw new Error('bodyMapImageName es obligatorio');
    if (!body.recibidoPorFirmaImg?.trim()) throw new Error('recibidoPorFirmaImg es obligatorio');
    if (!body.recibidoPorNombre?.trim()) throw new Error('recibidoPorNombre es obligatorio');
    if (!body.recibidoPorDocumento?.trim()) throw new Error('recibidoPorDocumento es obligatorio');

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

    const solicitadoEl = toSafeDate(body.solicitadoEl);
    const despachoHora = toSafeDate(body.despachoHora);
    const llegadaEscena = toSafeDate(body.llegadaEscenaHora);
    const salidaEscena = toSafeDate(body.salidaEscenaHora);
    const llegadaInstitucion = toSafeDate(body.llegadaInstitucionHora);
    const recepcionInstitucion = toSafeDate(body.recepcionInstitucionHora);

    if (llegadaEscena && despachoHora && llegadaEscena < despachoHora) {
      throw new Error('La llegada a escena no puede ser anterior a la hora de despacho');
    }
    if (llegadaEscena && solicitadoEl && llegadaEscena < solicitadoEl) {
      throw new Error('La llegada a escena no puede ser anterior a la hora de solicitud');
    }
    if (llegadaEscena && salidaEscena && salidaEscena < llegadaEscena) {
      throw new Error('La salida de escena no puede ser anterior a la llegada a escena');
    }
    if (salidaEscena && llegadaInstitucion && llegadaInstitucion < salidaEscena) {
      throw new Error('La llegada a la institución no puede ser anterior a la salida de escena');
    }
    if (llegadaInstitucion && recepcionInstitucion && recepcionInstitucion < llegadaInstitucion) {
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
      if (date.getTime() > Date.now()) throw new Error('fechaHoraRegistro no puede ser futura');
      if (
        salidaEscena &&
        recepcionInstitucion &&
        (date < salidaEscena || date > recepcionInstitucion)
      ) {
        throw new Error(
          'La fecha y hora del registro debe estar entre la salida de escena y la recepción por la institución'
        );
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
    if (salidaEscena && svFechaRegistro && svFechaRegistro < salidaEscena) {
      throw new Error(
        'La fechaRegistro de signos vitales no puede ser anterior a la hora de salida de escena'
      );
    }

    if (!body.vehiculoId) throw new Error('vehiculoId es obligatorio para la asignacion inicial');
    if (!body.conductor?.nombre?.trim() || !body.conductor?.documento?.trim()) {
      throw new Error('conductor es obligatorio para la asignacion inicial');
    }
    if (!body.auxiliar?.nombre?.trim() || !body.auxiliar?.documento?.trim()) {
      throw new Error('auxiliar es obligatorio para la asignacion inicial');
    }
  }

  public ensurePacienteTemporal(
    pacienteTemporal: Omit<CreateTrasladoPrimarioDto['pacienteTemporal'], 'soat'> & {
      soat?: string;
    },
    exigirSoat = true
  ): void {
    if (!pacienteTemporal) throw new Error('Debe enviar la informacion del paciente temporal');
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
    if (!pacienteTemporal.eps?.trim())
      throw new Error('La eps del paciente temporal es obligatoria');
    if (!pacienteTemporal.arl?.trim())
      throw new Error('La arl del paciente temporal es obligatoria');
    if (exigirSoat && !pacienteTemporal.soat?.trim()) {
      throw new Error('El soat del paciente temporal es obligatorio');
    }
  }

  public validateDocumentosUnicos(...personas: Array<{ documento?: string } | undefined>): void {
    const documentos = personas.filter(p => p?.documento).map(p => p.documento);
    if (new Set(documentos).size !== documentos.length) {
      throw new Error('Todos los integrantes asignados deben ser personas diferentes.');
    }
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

  public ensureEditable(traslado: TrasladoValidable): void {
    if (traslado.estadoCode !== ESTADOS_ASISTENCIA.CREADO.getCode()) {
      throw new Error('El traslado primario ya no se encuentra en estado CREADO');
    }
  }

  public ensureAccident(traslado: TrasladoValidable): void {
    if (traslado.tipoRemisionCode !== ACCIDENTE_TRANSITO.getCode()) {
      throw new Error('Esta seccion solo esta disponible para accidentes de transito');
    }
  }

  public validateFechaRegistro(value: string, descripcion: string, fechaMinima?: Date): void {
    const fecha = new Date(value);
    if (!value || Number.isNaN(fecha.getTime())) {
      throw new Error(`${descripcion} debe ser una fecha valida`);
    }
    if (fecha.getTime() > Date.now()) throw new Error(`${descripcion} no puede ser futura`);
    if (fechaMinima && fecha < fechaMinima) {
      throw new Error(`${descripcion} no puede ser anterior a la salida de escena`);
    }
  }

  public validateFechaClinicaSegmentado(
    value: string,
    descripcion: string,
    tramo: TramoClinicoValidable
  ): void {
    this.validateFechaRegistro(value, descripcion, tramo.horaSalidaEscena);
    if (tramo.horaRecepcionInst && new Date(value) > new Date(tramo.horaRecepcionInst)) {
      throw new Error(`${descripcion} no puede ser posterior a la recepción institucional`);
    }
  }

  public isMissing(value: unknown): boolean {
    return value === null || value === undefined || (typeof value === 'string' && !value.trim());
  }

  public isValidDate(value: unknown): value is Date | string {
    if (this.isMissing(value)) return false;
    const date = value instanceof Date ? value : new Date(value as string);
    return !Number.isNaN(date.getTime());
  }

  public isNumberInRange(value: unknown, minimum: number, maximum: number): boolean {
    if (this.isMissing(value)) return false;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum;
  }

  public addPending(
    pendientes: SeccionPendienteFinalizacion[],
    seccion: string,
    campo: string,
    mensaje: string
  ): void {
    let pendiente = pendientes.find(item => item.seccion === seccion);
    if (!pendiente) {
      pendiente = { seccion, campos: [] };
      pendientes.push(pendiente);
    }
    if (!pendiente.campos.some(item => item.campo === campo)) {
      pendiente.campos.push({ campo, mensaje });
    }
  }

  public validateVehiculo(body: VehiculoInvolucradoDto): void {
    if (!body.noIdentificado && !body.placa?.trim()) {
      throw new Error('La placa es obligatoria cuando el vehiculo esta identificado');
    }
  }
}
