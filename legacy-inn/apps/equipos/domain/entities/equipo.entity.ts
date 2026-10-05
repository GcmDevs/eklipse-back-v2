import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import {
  Id,
  normalizeOptionalUppercaseText,
  normalizeUppercaseText,
} from '@common/domain/value-objects';
import {
  EstadoEquipo,
  MotivoCambioEstadoEquipo,
  OrigenInicializacionPlan,
  TipoActividad,
} from '../enums';
import {
  DomainEquipoEvent,
  EquipoChangeEstadoEvent,
  EquipoCreatedEvent,
  EquipoImportedEvent,
  EquipoUpdatedEvent,
} from '../events';
import { EquipoBajaEvent } from '../events/equipo-baja.event';
import { normalizeLocalizacion } from '../policies/equipo-create.policies';
import { FotoItem, PeriodoDeTiempo, RegistroFotografico } from '../value-objects';
import { PlanActividad } from './actividades';

export class Equipo {
  private events: DomainEquipoEvent[] = [];

  private constructor(
    private id: Id,
    private nombre: string,
    private codigo: string,
    private numeroSerie: string,
    private numeroPlaca: string,
    private tipoEquipoRelId: Id,
    private numeroInventario: string | null,
    private planesActividad: PlanActividad[],
    private responsableId: Id,
    private estado: EstadoEquipo,
    private localizacion: string,
    private createdAt: Date,
    private updatedAt: Date,
    private fechaPuestaFuncionamiento?: Date,
    private observaciones?: string,
    private isLegacy?: boolean,
    private compraId?: Id,
    private registroFotografico?: RegistroFotografico,
    private planDefaultMantenimientoId?: Id,
    private planDefaultCalibracionId?: Id
  ) {}

  static create(
    nombre: string,
    codigo: string,
    numeroSerie: string,
    numeroPlaca: string,
    tipoEquipoRelId: number,
    numeroInventario: string | null,
    planesActividad: PlanActividad[],
    responsableId: number,
    estado: EstadoEquipo,
    localizacion?: string | null,
    fechaPuestaFuncionamiento?: Date,
    observaciones?: string,
    legacy?: boolean,
    compraId?: number,
    registroFotografico?: RegistroFotografico,
    planDefaultMantenimientoId?: number,
    planDefaultCalibracionId?: number
  ): Equipo {
    if (estado === EstadoEquipo.DE_BAJA) {
      throw new BadInputError('No se puede crear un equipo en estado DE BAJA');
    }

    const tipos = planesActividad.map(plan => plan.getTipo);
    if (new Set(tipos).size !== tipos.length) {
      throw new BadInputError('No puede haber dos planes del mismo tipo');
    }

    const equipo = new Equipo(
      new Id(),
      normalizeUppercaseText(nombre),
      normalizeUppercaseText(codigo),
      normalizeUppercaseText(numeroSerie),
      normalizeUppercaseText(numeroPlaca),
      new Id(tipoEquipoRelId),
      normalizeOptionalUppercaseText(numeroInventario),
      planesActividad,
      new Id(responsableId),
      estado,
      normalizeLocalizacion(localizacion),
      new Date(),
      new Date(),
      fechaPuestaFuncionamiento,
      observaciones?.trim() ?? null,
      legacy ?? false,
      compraId ? new Id(compraId) : undefined,
      registroFotografico,
      planDefaultMantenimientoId ? new Id(planDefaultMantenimientoId) : undefined,
      planDefaultCalibracionId ? new Id(planDefaultCalibracionId) : undefined
    );
    return equipo;
  }

  static rebuild(
    id: number,
    nombre: string,
    codigo: string,
    numeroSerie: string,
    numeroPlaca: string,
    tipoEquipoRelId: number,
    numeroInventario: string | null,
    planesActividad: PlanActividad[],
    responsableId: number,
    estado: EstadoEquipo,
    localizacion: string,
    createdAt: Date,
    updatedAt: Date,
    fechaPuestaFuncionamiento?: Date,
    observaciones?: string,
    legacy?: boolean,
    compraId?: number,
    registroFotografico?: RegistroFotografico,
    planDefaultMantenimientoId?: number,
    planDefaultCalibracionId?: number
  ): Equipo {
    return new Equipo(
      new Id(id),
      nombre,
      codigo,
      numeroSerie,
      numeroPlaca,
      new Id(tipoEquipoRelId),
      numeroInventario,
      planesActividad,
      new Id(responsableId),
      estado,
      localizacion,
      createdAt,
      updatedAt,
      fechaPuestaFuncionamiento,
      observaciones,
      legacy,
      compraId ? new Id(compraId) : undefined,
      registroFotografico,
      planDefaultMantenimientoId ? new Id(planDefaultMantenimientoId) : undefined,
      planDefaultCalibracionId ? new Id(planDefaultCalibracionId) : undefined
    );
  }

  getPlan(tipo: TipoActividad): PlanActividad | undefined {
    return this.planesActividad.find(plan => plan.getTipo === tipo);
  }

  get getPlanMantenimiento(): PlanActividad | undefined {
    return this.getPlan(TipoActividad.MANTENIMIENTO);
  }

  get getPlanCalibracion(): PlanActividad | undefined {
    return this.getPlan(TipoActividad.CALIBRACION);
  }

  get getPlanesActividad(): PlanActividad[] {
    return [...this.planesActividad];
  }

  changeEstado(
    nuevoEstado: EstadoEquipo,
    motivo: MotivoCambioEstadoEquipo,
    observaciones?: string
  ) {
    this.assertCanChangeEstado(nuevoEstado);
    const estadoAnterior = this.estado;

    this.estado = nuevoEstado;
    if (nuevoEstado === EstadoEquipo.EN_BODEGA) {
      this.deactivatePlanes();
    }
    this.updatedAt = new Date();
    this.events.push(
      new EquipoChangeEstadoEvent(
        this.id.getValor,
        estadoAnterior,
        nuevoEstado,
        motivo,
        observaciones
      )
    );
  }

  assertCanChangeEstado(nuevoEstado: EstadoEquipo) {
    this.ensureNotDeBaja();
    if (this.estado === nuevoEstado) {
      throw new BadInputError(`El equipo actualmente ya esta en estado ${this.estado}`);
    }
  }

  darBaja(): void {
    this.assertCanChangeEstado(EstadoEquipo.DE_BAJA);
    const estadoAnterior = this.estado;
    this.estado = EstadoEquipo.DE_BAJA;
    this.deactivatePlanes();

    this.updatedAt = new Date();
    this.events.push(new EquipoBajaEvent(this.id.getValor, estadoAnterior));
  }

  update(data: {
    numeroInventario?: string | null;
    tipoEquipoCatId?: number | null;
    localizacion?: string | null;
    fechaPuestaFuncionamiento?: Date | null;
    observaciones?: string | null;
    compraId?: number;
  }) {
    this.ensureNotDeBaja();
    if (data.tipoEquipoCatId !== undefined) this.tipoEquipoRelId = new Id(data.tipoEquipoCatId);
    if (data.observaciones !== undefined) this.observaciones = data.observaciones;
    if (data.fechaPuestaFuncionamiento !== undefined)
      this.fechaPuestaFuncionamiento = data.fechaPuestaFuncionamiento;

    if (data.localizacion !== undefined) {
      this.localizacion = normalizeLocalizacion(data.localizacion);
    }

    if (data.numeroInventario !== undefined) {
      this.numeroInventario = normalizeOptionalUppercaseText(data.numeroInventario);
    }

    if (data.compraId !== undefined) {
      this.compraId = new Id(data.compraId);
    }

    this.events.push(new EquipoUpdatedEvent(this.id.getValor, { ...data }));
    this.updatedAt = new Date();
  }

  updatePlan(
    tipo: TipoActividad,
    data: {
      formatoId?: number;
      periocidad?: PeriodoDeTiempo | null;
      seRealizaPorExterno?: boolean;
      fechaUltimaEjecucion?: Date | null;
      diasAnticipacionNotificacion?: number | null;
      origenInicializacion?: OrigenInicializacionPlan;
      observaciones?: string;
    }
  ): void {
    this.ensureNotDeBaja();
    let plan = this.getPlan(tipo);
    if (!plan) {
      plan = PlanActividad.create(
        tipo,
        data?.formatoId ?? null,
        data?.periocidad ?? null,
        data?.fechaUltimaEjecucion ?? null,
        data?.seRealizaPorExterno ?? null,
        data?.diasAnticipacionNotificacion ?? null,
        data?.origenInicializacion ?? OrigenInicializacionPlan.NUEVO,
        data?.observaciones
      );
      this.planesActividad.push(plan);
    } else {
      const { origenInicializacion, ...secureData } = data;
      plan.update(secureData);
    }

    this.events.push(new EquipoUpdatedEvent(this.id.getValor, { tipoActividad: tipo, ...data }));
    this.updatedAt = new Date();
  }

  deactivatePlanes() {
    this.planesActividad.map(plan => plan.deactivate());
  }

  pullEvents(): DomainEquipoEvent[] {
    const _events = [...this.events];
    this.events = [];
    return _events;
  }

  public ensureNotDeBaja(): void {
    if (this.estado === EstadoEquipo.DE_BAJA) {
      throw new BadInputError(
        'El equipo está dado de baja y no puede modificarse ni realizarse actividades para el'
      );
    }
  }

  registerCreatedEvent(): void {
    this.events.push(
      new EquipoCreatedEvent(this.id.getValor, {
        nombre: this.nombre,
        codigo: this.codigo,
        estado: this.estado,
        numeroSerie: this.numeroSerie,
        numeroPlaca: this.numeroPlaca,
        tipoEquipo: this.tipoEquipoRelId,
      })
    );
  }

  registerImportedEvent(legacy: { generalActivoId: number; activoId: number }): void {
    this.events.push(
      new EquipoImportedEvent(
        this.id.getValor,
        {
          nombre: this.nombre,
          codigo: this.codigo,
          estado: this.estado,
          numeroSerie: this.numeroSerie,
          numeroPlaca: this.numeroPlaca,
          tipoEquipo: this.tipoEquipoRelId,
        },
        {
          generalActivoId: legacy.generalActivoId,
          activoId: legacy.activoId,
          numeroPlaca: this.numeroPlaca,
        }
      )
    );
  }

  public addFoto(foto: FotoItem): void {
    const exist = this.registroFotografico.getArchivoIds().includes(foto.archivoId);
    if (exist) {
      throw new BadInputError(
        `El archivo con id: ${foto.archivoId} ya está asociado a este equipo`
      );
    }
    const actuales = this.registroFotografico.toPrimitives();
    this.registroFotografico = RegistroFotografico.create([...actuales, foto]);
  }

  public removeFoto(archivoId: number, usuarioId: number): void {
    const actuales = this.registroFotografico.toPrimitives();
    const idx = actuales.findIndex(f => f.archivoId === archivoId && !f.deleted);
    if (idx === -1) {
      throw new ResourceNotFoundError(
        `La fotografía con archivoId: ${archivoId} no está asociada a este equipo`
      );
    }

    actuales[idx] = {
      ...actuales[idx],
      deleted: true,
      deletedAt: new Date(),
      deletedBy: usuarioId,
    };
    this.registroFotografico = RegistroFotografico.create(actuales);
  }

  public updateFoto(archivoId: number, cambios: { descripcion?: string; orden?: number }): void {
    const actuales = this.registroFotografico.toPrimitives();
    const idx = actuales.findIndex(f => f.archivoId === archivoId && !f.deleted);
    if (idx === -1) {
      throw new ResourceNotFoundError(
        `La fotografía con archivoId: ${archivoId} no está asociada a este equipo o fue eliminada`
      );
    }
    actuales[idx] = { ...actuales[idx], ...cambios };
    this.registroFotografico = RegistroFotografico.create(actuales);
  }

  public markAsFotoPrincipal(archivoId: number): void {
    const actuales = this.registroFotografico.toPrimitives();
    const target = actuales.find(f => f.archivoId === archivoId && !f.deleted);
    if (!target) {
      throw new ResourceNotFoundError(
        `La fotografía con archivoId: ${archivoId} no está asociada a este equipo o fue eliminada`
      );
    }
    const actualizadas = actuales.map(f => ({
      ...f,
      principal: f.deleted ? f.principal : f.archivoId === archivoId,
    }));
    this.registroFotografico = RegistroFotografico.create(actualizadas);
  }

  get getId(): Id {
    return this.id;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getTipoEquipoCatId(): Id {
    return this.tipoEquipoRelId;
  }
  get getNumeroSerie(): string {
    return this.numeroSerie;
  }
  get getNumeroPlaca(): string {
    return this.numeroPlaca;
  }
  get getNumeroInventario(): string | null {
    return this.numeroInventario;
  }
  get getResponsableId(): Id {
    return this.responsableId;
  }
  get getEstado(): EstadoEquipo {
    return this.estado;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
  get getFechaPuestaFuncionamiento(): Date | undefined {
    return this.fechaPuestaFuncionamiento;
  }
  get getObservaciones(): string | null | undefined {
    return this.observaciones;
  }
  get getLocalizacion(): string {
    return this.localizacion;
  }
  get getIsLegacy(): boolean | undefined {
    return this.isLegacy;
  }
  get getCompraId(): Id | undefined {
    return this.compraId;
  }
  get getRegistroFotografico(): RegistroFotografico | undefined {
    return this.registroFotografico;
  }
  get getPlanDefaultMantenimientoId(): Id | undefined {
    return this.planDefaultMantenimientoId;
  }
  get getPlanDefaultCalibracionId(): Id | undefined {
    return this.planDefaultCalibracionId;
  }
}
