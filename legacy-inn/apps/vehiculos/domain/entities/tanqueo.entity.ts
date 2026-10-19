import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import {
  CodigoInconsistencia,
  OrigenTanqueo,
  SeveridadInconsistencia,
  TipoCombustible,
  TipoEvidencia,
} from '../enums';
import { EstadoTanqueo } from '../enums/estados.enum';
import { getEvidenciasRequeridasTanqueo } from '../policies';
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
import { BadInputError } from '@common/domain/errors';

export { EvidenciaSinResolverError };

const UMBRAL_SALTO_EXCESIVO_KM = 500;

export class Tanqueo {
  private constructor(
    private readonly id: Id,
    private readonly codigo: string,
    private activoId: Id,
    private usuarioId: Id,
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
    private inconsistencias: Inconsistencia[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static register(data: {
    codigo: string;
    activoId: number;
    usuarioId: number;
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
  }): Tanqueo {
    if (data.origen === OrigenTanqueo.REPOSITORIO && !data.repositorioId) {
      throw new BadInputError('El tanqueo desde repositorio requiere repositorioId');
    }
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
      new Id(data.usuarioId),
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
      EstadoTanqueo.REGISTRADO,
      data.evidencias,
      data.origenRegistro,
      null,
      null,
      null,
      false,
      [],
      now,
      now
    );
  }

  static rebuild(
    id: number,
    codigo: string,
    activoId: number,
    usuarioId: number,
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
    inconsistencias: Inconsistencia[],
    createdAt: Date,
    updatedAt: Date
  ): Tanqueo {
    return new Tanqueo(
      new Id(id),
      codigo,
      new Id(activoId),
      new Id(usuarioId),
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
      inconsistencias,
      createdAt,
      updatedAt
    );
  }

  calculateDerivados(kilometrajeAnterior: Kilometraje | null): void {
    if (!this.kilometraje || !kilometrajeAnterior) return;
    this.kilometrosRecorridos = this.kilometraje.distanciaDesde(kilometrajeAnterior);
    if (this.cantidadCombustible) {
      this.rendimiento = this.cantidadCombustible.calculateRendimiento(this.kilometrosRecorridos);
    }
  }

  updateKilometraje(nuevoKilometraje: Kilometraje): void {
    this.kilometraje = nuevoKilometraje;
    this.updatedAt = new Date();
  }

  registerInconsistenciasDeEvidencia(): void {
    this.evidencias.generateInconsistencias().forEach(inc => this.addInconsistencia(inc));
  }

  registerInconsistenciaKilometraje(kilometrajeAnterior: Kilometraje | null): void {
    if (!this.kilometraje || !kilometrajeAnterior) return;

    if (this.kilometraje.isMenorQue(kilometrajeAnterior)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.KM_MENOR_ANT,
          SeveridadInconsistencia.CRITICA,
          `El kilometraje (${this.kilometraje.getValorEnKm} km) es menor al ultimo conocido (${kilometrajeAnterior.getValorEnKm} km)`,
          'kilometraje'
        )
      );
      return;
    }

    if (this.kilometraje.saltoExcesivoDesde(kilometrajeAnterior, UMBRAL_SALTO_EXCESIVO_KM)) {
      this.addInconsistencia(
        createInconsistencia(
          CodigoInconsistencia.KM_SALTO_EXC,
          SeveridadInconsistencia.ADVERTENCIA,
          `El kilometraje aumento ${this.kilometraje.distanciaDesde(
            kilometrajeAnterior
          )} km desde el ultimo tanqueo`,
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
    if (!this.valorTotalPagado || promedio == null) return;
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
        CodigoInconsistencia.TQ_DUP_SOSPCH,
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
    this.assertEstadoRegistrado();
    const requiereOverride = this.requiresOverrideAprobacion();
    if (requiereOverride && !motivo?.trim()) {
      throw new BadInputError(
        'El motivo es obligatorio para aprobar con evidencias incompletas o inconsistencias críticas sin resolver'
      );
    }
    this.decididoPorUsuarioId = new Id(decididoPorId);
    this.fechaDecision = new Date();
    this.aprobacionConOverride = requiereOverride;
    if (motivo?.trim()) {
      this.motivoDecision = normalizeUppercaseText(motivo);
    }
    this.estado = EstadoTanqueo.APROBADO;
    this.updatedAt = new Date();
  }

  reject(decididoPorId: number, motivo: string): void {
    this.assertEstadoRegistrado();
    this.decididoPorUsuarioId = new Id(decididoPorId);
    this.fechaDecision = new Date();
    this.motivoDecision = normalizeUppercaseText(motivo);
    this.estado = EstadoTanqueo.RECHAZADO;
    this.updatedAt = new Date();
  }

  requiresOverrideAprobacion(): boolean {
    return !this.evidencias.areAllCompletas() || this.hasInconsistenciasCriticasSinResolver();
  }

  hasInconsistenciasCriticasSinResolver(): boolean {
    return this.inconsistencias.some(
      inc => inc.severidad === SeveridadInconsistencia.CRITICA && !inc.fechaResolucion
    );
  }

  private assertEstadoRegistrado(): void {
    if (this.estado !== EstadoTanqueo.REGISTRADO) {
      throw new BadInputError(`No se puede decidir un tanqueo en estado ${this.estado}`);
    }
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
  get getUsuarioId(): Id {
    return this.usuarioId;
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
  get getInconsistencias(): Inconsistencia[] {
    return [...this.inconsistencias];
  }
  get getTieneAlertas(): boolean {
    return this.inconsistencias.some(inc => !inc.fechaResolucion);
  }
  get getEvidenciasCompletas(): boolean {
    return this.evidencias.areAllCompletas();
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
