import { AmbulanciaView, AmbEventoRead, DotacionView, EntregaView, LimpiezaView, PlantillaView, TurnoView } from '../read';
import {
  AmbulanciaFlota,
  DotacionFlota,
  DotacionNovedad,
  ElementoVencFlota,
  EntregaDeclaracion,
  EntregaFlota,
  EventoFlota,
  LimpiezaFlota,
  PlantillaFlota,
  TurnoFlota,
} from '../entities';
import { TipoVencimientoFlota } from '../policies/vencimiento-job.policy';
import { EstadoDotacion, EstadoLimpieza, EstadoServicioAmbulancia, EstadoTurno, FormatoPlantilla, TipoAmbulanciaFlota } from '../enums';

export interface FlotaSearchScope {
  vehiculoIds?: number[];
  usuarioIds?: number[];
  /** Si true y ambos arrays vacíos, no hay coincidencias */
  sinCoincidencias?: boolean;
}

export interface AmbulanciaFlotaRepository {
  save(entity: AmbulanciaFlota): Promise<AmbulanciaFlota>;
  update(entity: AmbulanciaFlota): Promise<AmbulanciaFlota>;
  findByVehiculoId(vehiculoId: number): Promise<AmbulanciaFlota | null>;
  findById(id: number): Promise<AmbulanciaFlota | null>;
  findAllViews(search?: string, estadoServicio?: string): Promise<AmbulanciaView[]>;
  findViewByVehiculoId(vehiculoId: number): Promise<AmbulanciaView | null>;
  findAllEnServicio(): Promise<AmbulanciaFlota[]>;
  findAll(): Promise<AmbulanciaFlota[]>;
  findEnServicioSinTurnoActivo(): Promise<AmbulanciaFlota[]>;
  findFueraServicio(): Promise<AmbulanciaFlota[]>;
  countEnServicio(): Promise<number>;
}

export interface PlantillaFlotaRepository {
  save(entity: PlantillaFlota): Promise<PlantillaFlota>;
  update(entity: PlantillaFlota): Promise<PlantillaFlota>;
  findVigenteByFormato(formato: FormatoPlantilla): Promise<PlantillaFlota | null>;
  findById(id: number): Promise<PlantillaFlota | null>;
  findVersionesByFormato(formato: FormatoPlantilla): Promise<PlantillaView[]>;
  findMaxVersion(formato: FormatoPlantilla): Promise<number>;
  clearVigente(formato: FormatoPlantilla): Promise<void>;
  findByIds(ids: number[]): Promise<PlantillaFlota[]>;
}

export interface TurnoFlotaRepository {
  save(entity: TurnoFlota): Promise<TurnoFlota>;
  update(entity: TurnoFlota): Promise<TurnoFlota>;
  findById(id: number): Promise<TurnoFlota | null>;
  findActivoByVehiculo(vehiculoId: number): Promise<TurnoFlota | null>;
  findVigenteByResponsable(responsableId: number): Promise<TurnoFlota | null>;
  findActivos(): Promise<TurnoFlota[]>;
  findActivosOrdered(): Promise<TurnoFlota[]>;
  findActivosViews(): Promise<TurnoView[]>;
  findViewById(id: number): Promise<TurnoView | null>;
  findUltimaFechaFinByVehiculos(vehiculoIds: number[]): Promise<Map<number, Date>>;
  findMiTurno(usuarioId: number): Promise<TurnoFlota[]>;
  search(params: {
    vehiculoId?: number;
    estado?: EstadoTurno;
    desde?: Date;
    hasta?: Date;
    page: number;
    pageSize: number;
    searchScope?: FlotaSearchScope;
  }): Promise<[TurnoFlota[], number]>;
}

export interface EntregaFlotaRepository {
  save(entity: EntregaFlota): Promise<EntregaFlota>;
  update(entity: EntregaFlota): Promise<EntregaFlota>;
  findById(id: number): Promise<EntregaFlota | null>;
  findByTurnoSaliente(turnoSalienteId: number): Promise<EntregaFlota | null>;
  findViewById(id: number): Promise<EntregaView | null>;
  findByTurnoSalienteIds(turnoIds: number[]): Promise<EntregaFlota[]>;
  findByTurnoEntrante(turnoEntranteId: number): Promise<EntregaFlota | null>;
  findDisponiblesParaRecibir(usuarioId: number, now: Date): Promise<EntregaFlota[]>;
}

export interface EntregaDeclFlotaRepository {
  save(entity: EntregaDeclaracion): Promise<EntregaDeclaracion>;
  update(entity: EntregaDeclaracion): Promise<EntregaDeclaracion>;
  findById(id: number): Promise<EntregaDeclaracion | null>;
  findByEntregaAndRol(entregaId: number, rol: string): Promise<EntregaDeclaracion | null>;
  findByEntregaId(entregaId: number): Promise<EntregaDeclaracion[]>;
  bloquear(id: number): Promise<void>;
}

export interface LimpiezaFlotaRepository {
  save(entity: LimpiezaFlota): Promise<LimpiezaFlota>;
  update(entity: LimpiezaFlota): Promise<LimpiezaFlota>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<LimpiezaFlota | null>;
  findViewById(id: number): Promise<LimpiezaView | null>;
  findBorradorByTurno(turnoId: number): Promise<LimpiezaFlota | null>;
  findByTurno(turnoId: number): Promise<LimpiezaFlota[]>;
  search(params: {
    vehiculoId?: number;
    turnoId?: number;
    estado?: EstadoLimpieza;
    desde?: Date;
    hasta?: Date;
    page: number;
    pageSize: number;
    searchScope?: FlotaSearchScope;
  }): Promise<[LimpiezaFlota[], number]>;
  bloquear(id: number): Promise<void>;
}

export interface DotacionFlotaRepository {
  save(entity: DotacionFlota): Promise<DotacionFlota>;
  update(entity: DotacionFlota): Promise<DotacionFlota>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<DotacionFlota | null>;
  findViewById(id: number): Promise<DotacionView | null>;
  findByVehiculoAndFecha(vehiculoId: number, fecha: string): Promise<DotacionFlota | null>;
  findByFecha(fecha: string): Promise<DotacionFlota[]>;
  findByFechaRange(desde: string, hasta: string): Promise<DotacionFlota[]>;
  findByVehiculoAndFechaRange(vehiculoId: number, desde: string, hasta: string): Promise<DotacionFlota[]>;
  countByFecha(fecha: string): Promise<number>;
  search(params: {
    vehiculoId?: number;
    desde?: string;
    hasta?: string;
    estado?: EstadoDotacion;
    completa?: boolean;
    page: number;
    pageSize: number;
    searchScope?: FlotaSearchScope;
  }): Promise<[DotacionFlota[], number]>;
  findEnCursoVencidasEnRango(desde: string, hasta: string, now: Date): Promise<DotacionFlota[]>;
  bloquear(id: number): Promise<void>;
}

export interface DotacionNovedadRepository {
  save(entity: DotacionNovedad): Promise<DotacionNovedad>;
  update(entity: DotacionNovedad): Promise<DotacionNovedad>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<DotacionNovedad | null>;
  findByDotacion(dotacionId: number): Promise<DotacionNovedad[]>;
  findByDotacionAndKey(dotacionId: number, itemKey: string): Promise<DotacionNovedad | null>;
  countAbiertasGlobal(): Promise<number>;
  countByDotacionIds(dotacionIds: number[]): Promise<Map<number, { abiertas: number; total: number }>>;
  search(params: {
    estado?: string;
    vehiculoId?: number;
    desde?: Date;
    hasta?: Date;
    page: number;
    pageSize: number;
  }): Promise<[DotacionNovedad[], number]>;
}

export interface ElementoVencFlotaRepository {
  upsert(entity: ElementoVencFlota): Promise<void>;
  findByVehiculo(vehiculoId: number): Promise<ElementoVencFlota[]>;
  findByVehiculoAndKey(vehiculoId: number, itemKey: string): Promise<ElementoVencFlota | null>;
}

export interface EventoFlotaRepository {
  append(entity: EventoFlota): Promise<EventoFlota>;
  findByEntidad(entidad: string, entidadId: number): Promise<EventoFlota[]>;
  findUltimoPorTipo(entidad: string, entidadId: number, tipoEvento: string): Promise<EventoFlota | null>;
  findUltimosFueraServicioByAmbulanciaIds(ambulanciaIds: number[]): Promise<Map<number, EventoFlota>>;
  findServicioByAmbulanciaIds(
    ambulanciaIds: number[],
  ): Promise<Map<number, Array<{ tipoEvento: string; createdAt: Date }>>>;
}

export interface ProximoVencimientoRow {
  tipo: TipoVencimientoFlota;
  entidadId: number;
  fechaLimite: Date;
}

export interface PlazoVencimientoActual {
  /** true si la fila sigue en un estado que admite vencimiento y tiene plazo. */
  pendiente: boolean;
  fechaLimite: Date | null;
}

export interface VencimientoFlotaQuery {
  /** Filas pendientes cuyo plazo ya se cumplió a `now`. */
  findVencidos(now: Date): Promise<ProximoVencimientoRow[]>;
  /** Todas las filas pendientes con plazo (vencidas o futuras): el estado deseado de los jobs. */
  findPendientes(): Promise<ProximoVencimientoRow[]>;
  /** Estado y plazo vigentes en SQL de una fila concreta (misma regla que `findPendientes`). */
  findPlazoActual(tipo: TipoVencimientoFlota, entidadId: number): Promise<PlazoVencimientoActual>;
  /**
   * Toma un bloqueo de escritura sobre la fila dentro de la transacción activa, para
   * serializar resoluciones concurrentes (job vs. petición de usuario). Sin transacción
   * activa no hace nada.
   */
  bloquear(tipo: TipoVencimientoFlota, entidadId: number): Promise<void>;
}
