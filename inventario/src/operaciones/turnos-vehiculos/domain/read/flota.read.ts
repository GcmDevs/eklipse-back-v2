import {
  CausaCierreDeclaracion,
  CausaCierreEntrega,
  EstadoDeclaracion,
  EstadoDotacion,
  EstadoEntrega,
  EstadoLimpieza,
  EstadoNovedadDotacion,
  EstadoServicioAmbulancia,
  EstadoTurno,
  ModalidadDeclaracion,
  NoAplicaAcuerdo,
  OrigenTurno,
  RespuestaEntregaItem,
  RolDeclaracion,
  TipoAmbulanciaFlota,
} from '../enums';

export interface UsuarioLiteRead {
  id: number;
  nombre: string;
}

export interface AmbulanciaLiteRead {
  id?: number;
  vehiculoId: number;
  placa?: string;
  codigo?: string;
  tipoAmbulancia: TipoAmbulanciaFlota;
  estadoServicio: EstadoServicioAmbulancia;
}

export interface TurnoActivoResumenRead {
  id: number;
  estado: EstadoTurno;
}

export interface AmbulanciaView extends AmbulanciaLiteRead {
  turnoActivo: TurnoActivoResumenRead | null;
}

export interface EntregaDeclaracionResumenRead {
  id: number;
  usuario: UsuarioLiteRead | null;
  estado: EstadoDeclaracion;
  modalidad?: ModalidadDeclaracion;
  limiteEdicion?: Date;
  fechaCierre?: Date;
}

export interface EntregaAccionesRead {
  puedeLanzar: boolean;
  puedeRecibir: boolean;
  puedeRecibirExcepcional: boolean;
}

export interface EntregaResumenRead {
  id: number;
  estado: EstadoEntrega;
  causaCierre?: CausaCierreEntrega;
  fechaEntrega?: Date;
  limiteInicioRecepcion?: Date;
  habilitaExcepcionalEn: Date;
  cierreAutomaticoEn: Date;
  entrega: EntregaDeclaracionResumenRead | null;
  recepcion: EntregaDeclaracionResumenRead | null;
  acciones: EntregaAccionesRead;
  lanzadaPorAdministracion?: UsuarioLiteRead;
}

export interface EntregaItemMergedRead {
  key: string;
  texto: string;
  categoria: string;
  orden: number;
  entrega: { respuesta: string; observacion?: string; evidencias?: number[] } | null;
  recepcion: { respuesta: string; observacion?: string; evidencias?: number[] } | null;
  noAplica: NoAplicaAcuerdo | null;
}

export interface EntregaView extends EntregaResumenRead {
  items: EntregaItemMergedRead[];
  vehiculoId: number;
  turnoSalienteId: number;
  turnoEntranteId?: number;
}

export interface DeclaracionView {
  id: number;
  rol: RolDeclaracion;
  usuario: UsuarioLiteRead;
  estado: EstadoDeclaracion;
  modalidad?: ModalidadDeclaracion;
  causaCierre?: CausaCierreDeclaracion;
  limiteEdicion?: Date;
  fechaCierre?: Date;
  pendientes: number;
  items: {
    key: string;
    texto: string;
    categoria: string;
    orden: number;
    respuesta: string;
    observacion?: string;
    evidencias?: number[];
  }[];
}

export interface TurnoView {
  id: number;
  estado: EstadoTurno;
  origen: OrigenTurno;
  causaCierre?: string;
  fechaInicio: Date;
  fechaFin?: Date;
  ambulancia: AmbulanciaLiteRead;
  responsable: UsuarioLiteRead;
  entrega: EntregaResumenRead;
}

export interface IniciarRecepcionResultView {
  turno: TurnoView;
  entregaRecibida: EntregaView;
  entregaNueva: EntregaView;
  entrega?: EntregaView;
}

export interface LimpiezaResumenRead {
  id: number;
  estado: EstadoLimpieza;
  totalNc: number;
  fechaFinalizacion?: Date;
}

export interface LimpiezaView {
  id: number;
  turnoId: number;
  estado: EstadoLimpieza;
  causaCierre?: string;
  usuario: UsuarioLiteRead | null;
  reproceso: boolean | null;
  totalNc: number;
  pendientes: number;
  fechaFinalizacion?: Date;
  items: {
    key: string;
    texto: string;
    categoria: string;
    orden: number;
    respuesta: 'C' | 'NC' | null;
    observacion?: string;
    evidencias?: number[];
  }[];
}

export interface DotacionNovedadRead {
  id: number;
  itemKey: string;
  estado: EstadoNovedadDotacion;
  cantidadEsperada?: number;
  cantidadEncontrada?: number;
  diferencia?: number;
  fechaVencRegistrada?: string;
  fechaVencObservada?: string;
  observacion: string;
  resueltaPor?: UsuarioLiteRead;
  fechaResolucion?: Date;
  observacionResolucion?: string;
}

export interface DotacionView {
  id: number;
  ambulancia: AmbulanciaLiteRead;
  fecha: string;
  estado: EstadoDotacion;
  completa?: boolean;
  bloqueada: boolean;
  cierreAutomatico: boolean;
  usuario: UsuarioLiteRead | null;
  fechaInicio?: Date;
  fechaLimite?: Date;
  fechaUltimoCierre?: Date;
  borradorDescartado: boolean;
  pendientes: number;
  items: {
    key: string;
    texto: string;
    categoria: string;
    orden: number;
    cantidadEsperada?: number;
    estado: string;
    cantidadEncontrada?: number | null;
    diferencia?: number | null;
    fechaVencRegistrada?: string | null;
    fechaVencObservada?: string | null;
    observacion?: string | null;
  }[];
  novedades?: DotacionNovedadRead[];
}

export interface AmbEventoRead {
  id: number;
  entidad: string;
  entidadId: number;
  tipoEvento: string;
  usuario: UsuarioLiteRead | null;
  motivo?: string;
  detalle?: Record<string, unknown>;
  createdAt: Date;
}

export interface PlantillaView {
  id: number;
  formato: string;
  version: number;
  vigente: boolean;
  estructura: Record<string, unknown>;
  creadoPorId: number;
  createdAt: Date;
}

export interface FlotaSsePayload {
  tipo: string;
  entidad: string;
  entidadId: number;
  vehiculoId?: number;
}

export interface DotacionHoyRead {
  id: number;
  estado: EstadoDotacion;
  completa?: boolean;
  novedadesAbiertas: number;
}

export interface TableroResumenRead {
  turnosActivos: number;
  recepcionesPendientes: number;
  ambulanciasSinTurno: number;
  ambulanciasFueraServicio: number;
  novedadesAbiertas: number;
  dotacionesSinIniciarHoy: number;
}

export interface TurnoTableroView extends TurnoView {
  dotacionHoy: DotacionHoyRead | null;
}

export interface AmbulanciaSinTurnoView extends AmbulanciaView {
  ultimoTurnoFin: string | null;
  dotacionHoy: DotacionHoyRead | null;
}

export interface AmbulanciaFueraServicioView extends AmbulanciaView {
  motivo: string;
  fechaDesde: string;
}

export interface TableroView {
  fecha: string;
  resumen: TableroResumenRead;
  turnosActivos: TurnoTableroView[];
  ambulanciasSinTurno: AmbulanciaSinTurnoView[];
  ambulanciasFueraServicio: AmbulanciaFueraServicioView[];
}

export type DotacionGrillaResultado =
  | 'COMPLETA'
  | 'INCOMPLETA_MANUAL'
  | 'INCOMPLETA_VENCIDA'
  | 'EN_CURSO'
  | 'SIN_VERIFICAR'
  | 'FUERA_SERVICIO'
  | 'PENDIENTE_INICIAR';

export interface DotacionGrillaCeldaRead {
  dia: number;
  dotacionId: number | null;
  resultado: DotacionGrillaResultado;
  usuario: UsuarioLiteRead | null;
  fechaInicio: string | null;
  novedadesAbiertas: number;
  novedadesTotal: number;
  borradorDescartado: boolean;
}

export interface DotacionGrillaResumenRead {
  COMPLETA: number;
  INCOMPLETA_MANUAL: number;
  INCOMPLETA_VENCIDA: number;
  EN_CURSO: number;
  SIN_VERIFICAR: number;
  FUERA_SERVICIO: number;
  PENDIENTE_INICIAR: number;
  cumplimientoPct: number | null;
}

export interface DotacionGrillaFilaRead {
  ambulancia: {
    id?: number;
    vehiculoId: number;
    placa?: string;
    codigo?: string;
    tipoAmbulancia: TipoAmbulanciaFlota;
  };
  dias: DotacionGrillaCeldaRead[];
  resumen: DotacionGrillaResumenRead;
}

export interface DotacionGrillaView {
  mes: number;
  anio: number;
  diasEnMes: number;
  hoy: string;
  filas: DotacionGrillaFilaRead[];
}

export interface DotacionGrillaRegistroDiaRead {
  dia: number;
  dotacionId: number | null;
  resultado: DotacionGrillaResultado;
  usuario: UsuarioLiteRead | null;
  fechaInicio: string | null;
  borradorDescartado?: boolean;
}

export interface DotacionGrillaItemCeldaRead {
  dia: number;
  estado: 'CONFORME' | 'NOVEDAD' | 'PENDIENTE';
  cantidadEncontrada?: number | null;
}

export interface DotacionGrillaItemRead {
  key: string;
  texto: string;
  cantidadEsperada?: number;
  dias: DotacionGrillaItemCeldaRead[];
}

export interface DotacionGrillaCategoriaRead {
  key: string;
  nombre: string;
  items: DotacionGrillaItemRead[];
}

export interface DotacionGrillaItemsView {
  ambulancia: AmbulanciaView;
  mes: number;
  anio: number;
  diasEnMes: number;
  hoy: string;
  registros: DotacionGrillaRegistroDiaRead[];
  categorias: DotacionGrillaCategoriaRead[];
}

export type MiTurnoEtapa = 'OPERANDO' | 'ENTREGADO_ESPERANDO_RECEPTOR' | 'CERRADO_CON_PENDIENTES';

export interface FormularioEstadoRead {
  estado:
    | 'NO_INICIADO'
    | 'EN_CURSO'
    | 'COMPLETO'
    | 'CERRADO_CON_PENDIENTES'
    | 'VENCIDO_SIN_CERRAR'
    | 'SIN_DILIGENCIAR';
  borradorDescartado?: boolean;
}

/** Detalle de turno: Entrega y Limpieza reales. Sin dotación. */
export interface TurnoDetalleView {
  turno: TurnoView;
  etapa: MiTurnoEtapa;
  receptor: UsuarioLiteRead | null;
  entregaSaliente: EntregaView;
  recepcionEntrante: EntregaView | null;
  limpiezas: LimpiezaView[];
  formularios: {
    entrega: FormularioEstadoRead;
    recepcion: FormularioEstadoRead | null;
    limpieza: FormularioEstadoRead;
  };
}

/** Misma forma que el detalle: Entrega + Limpieza. Sin dotación. */
export type MiTurnoItemView = TurnoDetalleView;

export interface MiTurnoView {
  fecha: string;
  turnos: MiTurnoItemView[];
  entregasDisponibles: TurnoView[];
}

export interface ElementoVencRead {
  itemKey: string;
  texto: string;
  categoria: string;
  cantidadEsperada?: number;
  fechaVencimiento: string | null;
  actualizadoPor?: UsuarioLiteRead;
  updatedAt?: string;
}
