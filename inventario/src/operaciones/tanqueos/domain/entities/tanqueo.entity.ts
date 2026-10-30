import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import {
  CanalRegistro,
  CodigoInconsistencia,
  ModoValidacionUbicacion,
  OrigenTanqueo,
  SeveridadInconsistencia,
  TipoCombustible,
  TipoEvidencia,
  TipoRegistroTanqueo,
} from '../enums';
import { EstadoInconsistencia, EstadoTanqueo } from '../enums/estados.enum';
import {
  assertTanqueoMarkReviewed,
  assertTanqueoReviewNotOwnRecord,
  assertTanqueoTransitionState,
  assertTipoYCanalRegistro,
  cuentaCodigoInconsistenciaParaEstado,
  getEvidenciasRequeridasTanqueo,
  isValorPagadoFueraDeRangoAlerta,
  tanqueoInitialState,
  umbralSaltoKilometraje,
} from '../policies';
import {
  EvaluacionUbicacionTanqueoResult,
  ValidacionUbicacionSnapshot,
} from '../services/ubicacion-tanqueo.validator';
import { Inconsistencia, createInconsistencia } from '../types';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciaSinResolverError,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
  ValorMonetario,
} from '../value-objects';

export { EvidenciaSinResolverError };

export class Tanqueo {
  private constructor(
    private readonly id: Id,
    private readonly codigo: string,
    private activoId: Id,
    private registradoPorId: Id,
    private tipoRegistro: TipoRegistroTanqueo,
    private canalRegistro: CanalRegistro,
    private conductorRealId: Id | null,
    private origen: OrigenTanqueo,
    private repositorioId: Id | null,
    private kilometraje: Kilometraje | null,
    private kilometrosRecorridos: number | null,
    private valorTotalPagado: ValorMonetario | null,
    private cantidadCombustible: CantidadCombustible | null,
    private tipoCombustible: TipoCombustible | null,
    private rendimiento: number | null,
    private estacionServicioId: Id | null,
    private fechaTanqueo: Date,
    private ubicacion: CoordenadasGPS | null,
    private observaciones: string | null,
    private estado: EstadoTanqueo,
    private evidencias: EvidenciasTanqueo,
    private origenRegistro: OrigenRegistro,
    private decididoPorUsuarioId: Id | null,
    private fechaDecision: Date | null,
    private motivoDecision: string | null,
    private aprobacionConOverride: boolean,
    private anuladoPorId: Id | null,
    private fechaAnulacion: Date | null,
    private motivoAnulacion: string | null,
    private inconsistencias: Inconsistencia[],
    private readonly createdAt: Date,
    private updatedAt: Date,
    private validacionUbicacion: ValidacionUbicacionSnapshot | null = null
  ) { }

  static register(data: {
    codigo: string;
    activoId: number;
    registradoPorId: number;
    tipoRegistro: TipoRegistroTanqueo;
    canalRegistro: CanalRegistro;
    conductorRealId?: number | null;
    origen: OrigenTanqueo;
    repositorioId?: number | null;
    kilometraje: Kilometraje | null;
    valorTotalPagado: ValorMonetario | null;
    cantidadCombustible: CantidadCombustible | null;
    tipoCombustible: TipoCombustible;
    estacionServicioId: number | null;
    fechaTanqueo: Date;
    ubicacion: CoordenadasGPS | null;
    observaciones: string | null;
    evidencias: EvidenciasTanqueo;
    origenRegistro: OrigenRegistro;
    tiposEvidenciaRequeridos?: readonly TipoEvidencia[];
    loteEstacion?: boolean;
    validacionUbicacion?: ValidacionUbicacionSnapshot | null;
  }): Tanqueo {
    if (data.origen === OrigenTanqueo.REPOSITORIO && !data.repositorioId) {
      throw new BadInputError('El tanqueo desde repositorio requiere repositorioId');
    }
    if (!data.tipoRegistro || !data.canalRegistro) {
      throw new BadInputError('TIPOREGISTRO y CANALREGISTRO son obligatorios');
    }
    assertTipoYCanalRegistro({
      tipoRegistro: data.tipoRegistro,
      canalRegistro: data.canalRegistro,
      conductorRealId: data.conductorRealId,
    });
    const requeridos =
      data.tiposEvidenciaRequeridos ??
      getEvidenciasRequeridasTanqueo(data.origen, { loteEstacion: data.loteEstacion });
    const faltantes = data.evidencias.findTiposSinResolver(requeridos);
    if (faltantes.length > 0) {
      throw new EvidenciaSinResolverError(faltantes);
    }

    const now = new Date();
    return new Tanqueo(
      new Id(),
      data.codigo,
      new Id(data.activoId),
      new Id(data.registradoPorId),
      data.tipoRegistro,
      data.canalRegistro,
      data.conductorRealId != null ? new Id(data.conductorRealId) : null,
      data.origen,
      data.repositorioId != null ? new Id(data.repositorioId) : null,
      data.kilometraje,
      null,
      data.valorTotalPagado,
      data.cantidadCombustible,
      data.tipoCombustible,
      null,
      data.estacionServicioId != null ? new Id(data.estacionServicioId) : null,
      data.fechaTanqueo,
      data.ubicacion,
      data.observaciones,
      EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
      data.evidencias,
      data.origenRegistro,
      null,
      null,
      null,
      false,
      null,
      null,
      null,
      [],
      now,
      now,
      data.validacionUbicacion ?? null
    );
  }

  static rebuild(
    id: number,
    codigo: string,
    activoId: number,
    registradoPorId: number,
    tipoRegistro: TipoRegistroTanqueo,
    canalRegistro: CanalRegistro,
    conductorRealId: number | null,
    origen: OrigenTanqueo,
    repositorioId: number | null,
    kilometraje: Kilometraje | null,
    kilometrosRecorridos: number | null,
    valorTotalPagado: ValorMonetario | null,
    cantidadCombustible: CantidadCombustible | null,
    tipoCombustible: TipoCombustible | null,
    rendimiento: number | null,
    estacionServicioId: number | null,
    fechaTanqueo: Date,
    ubicacion: CoordenadasGPS | null,
    observaciones: string | null,
    estado: EstadoTanqueo,
    evidencias: EvidenciasTanqueo,
    origenRegistro: OrigenRegistro,
    decididoPorUsuarioId: number | null,
    fechaDecision: Date | null,
    motivoDecision: string | null,
    aprobacionConOverride: boolean,
    anuladoPorId: number | null,
    fechaAnulacion: Date | null,
    motivoAnulacion: string | null,
    inconsistencias: Inconsistencia[],
    createdAt: Date,
    updatedAt: Date,
    validacionUbicacion: ValidacionUbicacionSnapshot | null = null
  ): Tanqueo {
    return new Tanqueo(
      new Id(id),
      codigo,
      new Id(activoId),
      new Id(registradoPorId),
      tipoRegistro,
      canalRegistro,
      conductorRealId != null ? new Id(conductorRealId) : null,
      origen,
      repositorioId != null ? new Id(repositorioId) : null,
      kilometraje,
      kilometrosRecorridos,
      valorTotalPagado,
      cantidadCombustible,
      tipoCombustible,
      rendimiento,
      estacionServicioId != null ? new Id(estacionServicioId) : null,
      fechaTanqueo,
      ubicacion,
      observaciones,
      estado,
      evidencias,
      origenRegistro,
      decididoPorUsuarioId !== null ? new Id(decididoPorUsuarioId) : null,
      fechaDecision,
      motivoDecision,
      aprobacionConOverride,
      anuladoPorId != null ? new Id(anuladoPorId) : null,
      fechaAnulacion,
      motivoAnulacion,
      inconsistencias,
      createdAt,
      updatedAt,
      validacionUbicacion
    );
  }

  sealEstadoInicial(): void {
    this.estado = tanqueoInitialState(this.hasInconsistenciasCriticasAbiertas());
    this.updatedAt = new Date();
  }

  sincronizarEstadoTrasReevaluacionAlertas(tieneCriticasAbiertas: boolean): void {
    if (this.estado === EstadoTanqueo.ANULADO) return;
    if (tieneCriticasAbiertas) {
      if (
        this.estado === EstadoTanqueo.VALIDADO_AUTOMATICAMENTE ||
        this.estado === EstadoTanqueo.VALIDADO_MANUALMENTE
      ) {
        assertTanqueoTransitionState(this.estado, EstadoTanqueo.APTO_PARA_REVISION);
        this.estado = EstadoTanqueo.APTO_PARA_REVISION;
        this.updatedAt = new Date();
      }
      return;
    }
    if (this.estado === EstadoTanqueo.APTO_PARA_REVISION) {
      this.estado = EstadoTanqueo.VALIDADO_AUTOMATICAMENTE;
      this.updatedAt = new Date();
    }
  }

  calculateDerivados(kilometrajeAnterior: Kilometraje | null): void {
    if (!this.kilometraje || !kilometrajeAnterior) return;
    if (this.kilometraje.isMenorQue(kilometrajeAnterior)) {
      this.kilometrosRecorridos = null;
      this.rendimiento = null;
      return;
    }
    this.kilometrosRecorridos = this.kilometraje.distanciaDesde(kilometrajeAnterior);
    if (this.cantidadCombustible) {
      this.rendimiento = this.cantidadCombustible.calculateRendimiento(this.kilometrosRecorridos);
    }
  }

  replaceKilometrajeReportado(nuevo: Kilometraje): void {
    this.kilometraje = nuevo;
    this.updatedAt = new Date();
  }

  replaceCantidad(cantidad: CantidadCombustible): void {
    this.cantidadCombustible = cantidad;
    this.updatedAt = new Date();
  }

  replaceValorPagado(valor: ValorMonetario | null): void {
    this.valorTotalPagado = valor;
    this.updatedAt = new Date();
  }

  replaceEstacion(estacionId: number): void {
    this.estacionServicioId = new Id(estacionId);
    this.updatedAt = new Date();
  }

  replaceFechaTanqueo(fecha: Date): void {
    this.fechaTanqueo = fecha;
    this.updatedAt = new Date();
  }

  replaceObservaciones(observaciones: string | null): void {
    this.observaciones = observaciones;
    this.updatedAt = new Date();
  }

  replaceOrigenRepositorio(origen: OrigenTanqueo, repositorioId: number | null): void {
    if (origen === OrigenTanqueo.REPOSITORIO && repositorioId == null) {
      throw new BadInputError('El tanqueo desde repositorio requiere repositorioId');
    }
    this.origen = origen;
    this.repositorioId = repositorioId != null ? new Id(repositorioId) : null;
    this.updatedAt = new Date();
  }

  replaceEvidencias(evidencias: EvidenciasTanqueo): void {
    this.evidencias = evidencias;
    this.updatedAt = new Date();
  }

  replaceValidacionUbicacionSnapshot(snapshot: ValidacionUbicacionSnapshot | null): void {
    this.validacionUbicacion = snapshot;
    this.updatedAt = new Date();
  }

  applyValidacionUbicacion(
    evaluacion: EvaluacionUbicacionTanqueoResult,
    modo: ModoValidacionUbicacion
  ): void {
    if (modo === ModoValidacionUbicacion.OFF || !evaluacion.snapshot) {
      this.validacionUbicacion = null;
      return;
    }
    this.validacionUbicacion = evaluacion.snapshot;
    if (modo === ModoValidacionUbicacion.ACTIVE && evaluacion.codigoInconsistencia) {
      this.registerInconsistenciaUbicacion(
        evaluacion.codigoInconsistencia,
        evaluacion.mensajeInconsistencia ?? evaluacion.codigoInconsistencia
      );
    }
    this.updatedAt = new Date();
  }

  registerInconsistenciaUbicacion(
    codigo:
      | CodigoInconsistencia.UBIC_FUERA_RAD
      | CodigoInconsistencia.UBIC_DISCREP
      | CodigoInconsistencia.UBIC_NO_CONC,
    mensaje: string
  ): void {
    this.addInconsistencia(
      createInconsistencia(
        codigo,
        SeveridadInconsistencia.ADVERTENCIA,
        mensaje,
        'ubicacion'
      )
    );
  }

  registerInconsistenciasDeEvidencia(): void {
    this.evidencias.generateInconsistencias().forEach(inc => this.addInconsistencia(inc));
  }

  registerInconsistenciaKilometraje(
    kilometrajeAnterior: Kilometraje | null,
    umbralSalto: number
  ): void {
    if (!this.kilometraje || !kilometrajeAnterior) return;

    if (this.kilometraje.isMenorQue(kilometrajeAnterior)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.KM_MENOR_ANT,
          SeveridadInconsistencia.ADVERTENCIA,
          `El kilometraje (${this.kilometraje.getValorEnKm} km) es menor al ultimo conocido (${kilometrajeAnterior.getValorEnKm} km)`,
          'kilometraje'
        )
      );
      return;
    }

    if (this.kilometraje.saltoExcesivoDesde(kilometrajeAnterior, umbralSalto)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.KM_SALTO,
          SeveridadInconsistencia.ADVERTENCIA,
          `El kilometraje aumento ${this.kilometraje.distanciaDesde(
            kilometrajeAnterior
          )} km (umbral ${umbralSalto})`,
          'kilometraje'
        )
      );
    }
  }

  registerInconsistenciaCapacidad(capacidadTanque: number | null): void {
    if (!capacidadTanque || !this.cantidadCombustible) return;
    if (this.cantidadCombustible.exceedsCapacidad(capacidadTanque)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.CANT_COMB_CAP,
          SeveridadInconsistencia.ADVERTENCIA,
          `La cantidad suministrada supera el 95% de la capacidad configurada del tanque (${capacidadTanque})`,
          'cantidadCombustible'
        )
      );
    }
  }

  registerInconsistenciaValorAlto(promedio: number | null, factorMaximo: number): void {
    if (!this.valorTotalPagado) return;
    if (isValorPagadoFueraDeRangoAlerta(this.valorTotalPagado.getMonto)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.VALOR_ALTO_INU,
          SeveridadInconsistencia.ADVERTENCIA,
          `El valor pagado (${this.valorTotalPagado.getMonto}) está fuera del rango de alerta configurable`,
          'valorTotalPagado'
        )
      );
      return;
    }
    if (promedio == null) return;
    if (this.valorTotalPagado.isInusualmenteAltoRespectoA(promedio, factorMaximo)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.VALOR_ALTO_INU,
          SeveridadInconsistencia.ADVERTENCIA,
          `El valor pagado (${this.valorTotalPagado.getMonto}) es inusualmente alto respecto al promedio (${promedio})`,
          'valorTotalPagado'
        )
      );
    }
  }

  registerInconsistenciaDuplicadoSospechoso(): void {
    this.addInconsistencia(
      createInconsistencia(
        CodigoInconsistencia.TQ_DUP,
        SeveridadInconsistencia.ADVERTENCIA,
        'Existe un tanqueo reciente del mismo activo con valor y fecha similares',
        'tanqueo'
      )
    );
  }

  private addInconsistencia(inconsistencia: Inconsistencia): void {
    this.inconsistencias.push(inconsistencia);
  }

  confirmRegistro(): void {
    if (this.origenRegistro.getCreadoOffline) {
      this.origenRegistro = this.origenRegistro.markSincronizacion(new Date());
    }
  }

  approve(decididoPorId: number, motivo?: string): void {
    assertTanqueoTransitionState(this.estado, EstadoTanqueo.VALIDADO_MANUALMENTE);
    assertTanqueoReviewNotOwnRecord(decididoPorId, this.registradoPorId, this.conductorRealId);
    const requiereOverride = this.requiresOverrideAprobacion();
    if (requiereOverride && !motivo?.trim()) {
      throw new BadInputError(
        'motivoOverride es obligatorio para aprobar con inconsistencias críticas abiertas'
      );
    }
    this.decididoPorUsuarioId = new Id(decididoPorId);
    this.fechaDecision = new Date();
    this.aprobacionConOverride = requiereOverride;
    if (motivo?.trim()) {
      this.motivoDecision = normalizeUppercaseText(motivo);
    }
    this.estado = EstadoTanqueo.VALIDADO_MANUALMENTE;
    this.updatedAt = new Date();
  }

  markReviewed(decididoPorId: number): void {
    assertTanqueoMarkReviewed(this.estado);
    assertTanqueoTransitionState(this.estado, EstadoTanqueo.VALIDADO_MANUALMENTE);
    assertTanqueoReviewNotOwnRecord(decididoPorId, this.registradoPorId, this.conductorRealId);
    this.decididoPorUsuarioId = new Id(decididoPorId);
    this.fechaDecision = new Date();
    this.estado = EstadoTanqueo.VALIDADO_MANUALMENTE;
    this.updatedAt = new Date();
  }

  review(decididoPorId: number, estadoDestino: EstadoTanqueo, motivo?: string): void {
    assertTanqueoReviewNotOwnRecord(decididoPorId, this.registradoPorId, this.conductorRealId);
    if (estadoDestino === EstadoTanqueo.VALIDADO_MANUALMENTE) {
      if (this.estado === EstadoTanqueo.APTO_PARA_REVISION) {
        this.approve(decididoPorId, motivo);
        return;
      }
      if (this.estado === EstadoTanqueo.VALIDADO_AUTOMATICAMENTE) {
        this.markReviewed(decididoPorId);
        return;
      }
      throw new BadInputError(
        `No se puede validar manualmente desde el estado ${this.estado}`
      );
    }
    if (estadoDestino === EstadoTanqueo.APTO_PARA_REVISION) {
      assertTanqueoTransitionState(this.estado, estadoDestino);
      this.estado = estadoDestino;
      this.aprobacionConOverride = false;
      this.updatedAt = new Date();
      return;
    }
    throw new BadInputError(`estadoDestino no soportado: ${estadoDestino}`);
  }

  voidRecord(anuladoPorId: number, motivo: string): void {
    if (!motivo?.trim()) {
      throw new BadInputError('El motivo de anulación es obligatorio');
    }
    assertTanqueoTransitionState(this.estado, EstadoTanqueo.ANULADO);
    this.anuladoPorId = new Id(anuladoPorId);
    this.fechaAnulacion = new Date();
    this.motivoAnulacion = normalizeUppercaseText(motivo);
    this.estado = EstadoTanqueo.ANULADO;
    this.updatedAt = new Date();
  }

  requiresOverrideAprobacion(): boolean {
    return this.hasInconsistenciasCriticasAbiertas();
  }

  hasInconsistenciasCriticasAbiertas(): boolean {
    return this.inconsistencias.some(
      inc =>
        inc.severidad === SeveridadInconsistencia.CRITICA &&
        inc.estado !== EstadoInconsistencia.CERRADA &&
        !inc.fechaResolucion &&
        cuentaCodigoInconsistenciaParaEstado(inc.codigo)
    );
  }

  hasInconsistenciasCriticasSinResolver(): boolean {
    return this.hasInconsistenciasCriticasAbiertas();
  }

  isLecturaOdometroConfiable(referenciaKm: number | null, umbralSalto: number): boolean {
    if (!this.kilometraje) return false;
    if (referenciaKm == null) return true;
    const anterior = Kilometraje.create(referenciaKm);
    if (this.kilometraje.isMenorQue(anterior)) return false;
    if (this.kilometraje.saltoExcesivoDesde(anterior, umbralSalto)) return false;
    return true;
  }

  umbralSaltoParaActivo(
    capacidadTanque: number | null,
    rendimientoEsperado: number | null
  ): number {
    return umbralSaltoKilometraje(capacidadTanque, rendimientoEsperado);
  }

  get getId(): Id {
    return this.id;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getActivoId(): Id {
    return this.activoId;
  }
  get getRegistradoPorId(): Id {
    return this.registradoPorId;
  }
  get getTipoRegistro(): TipoRegistroTanqueo {
    return this.tipoRegistro;
  }
  get getCanalRegistro(): CanalRegistro {
    return this.canalRegistro;
  }
  get getConductorRealId(): Id | null {
    return this.conductorRealId;
  }
  get getOrigen(): OrigenTanqueo {
    return this.origen;
  }
  get getRepositorioId(): Id | null {
    return this.repositorioId;
  }
  get getKilometraje(): Kilometraje | null {
    return this.kilometraje;
  }
  get getKilometrosRecorridos(): number | null {
    return this.kilometrosRecorridos;
  }
  get getValorTotalPagado(): ValorMonetario | null {
    return this.valorTotalPagado;
  }
  get getCantidadCombustible(): CantidadCombustible | null {
    return this.cantidadCombustible;
  }
  get getTipoCombustible(): TipoCombustible | null {
    return this.tipoCombustible ?? this.cantidadCombustible?.getTipo ?? null;
  }
  get getRendimiento(): number | null {
    return this.rendimiento;
  }
  get getEstacionServicioId(): Id | null {
    return this.estacionServicioId;
  }
  get getFechaTanqueo(): Date {
    return this.fechaTanqueo;
  }
  get getUbicacion(): CoordenadasGPS | null {
    return this.ubicacion;
  }
  get getObservaciones(): string | null {
    return this.observaciones;
  }
  get getEstado(): EstadoTanqueo {
    return this.estado;
  }
  get getEvidencias(): EvidenciasTanqueo {
    return this.evidencias;
  }
  get getOrigenRegistro(): OrigenRegistro {
    return this.origenRegistro;
  }
  get getDecididoPorUsuarioId(): Id | null {
    return this.decididoPorUsuarioId;
  }
  get getFechaDecision(): Date | null {
    return this.fechaDecision;
  }
  get getMotivoDecision(): string | null {
    return this.motivoDecision;
  }
  get getAprobacionConOverride(): boolean {
    return this.aprobacionConOverride;
  }
  get getAnuladoPorId(): Id | null {
    return this.anuladoPorId;
  }
  get getFechaAnulacion(): Date | null {
    return this.fechaAnulacion;
  }
  get getMotivoAnulacion(): string | null {
    return this.motivoAnulacion;
  }
  get getInconsistencias(): Inconsistencia[] {
    return [...this.inconsistencias];
  }
  get getTieneAlertas(): boolean {
    return this.inconsistencias.some(inc => !inc.fechaResolucion);
  }
  get getEvidenciasCompletas(): boolean {
    const loteEstacion =
      this.origen === OrigenTanqueo.ESTACION &&
      (this.origenRegistro.getCreadoOffline || this.canalRegistro === CanalRegistro.MOVIL);
    const requeridos = getEvidenciasRequeridasTanqueo(this.origen, { loteEstacion });
    return this.evidencias.areAllCompletas(requeridos);
  }
  get getValidacionUbicacion(): ValidacionUbicacionSnapshot | null {
    return this.validacionUbicacion;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
