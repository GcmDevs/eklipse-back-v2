import { ProcesoReportes, TipoDocumentoReporte } from './proceso';

export interface ArchivoReporte {
  id: string;
  nombre: string;
  bytes: number;
  tipo: 'historias-clinicas' | 'enfermeria' | 'prefactura' | 'soportes-requeridos';
  grupo: number;
  totalGrupos: number;
  unificado?: boolean;
  paginas?: number;
}

export interface ProgresoReportes {
  etapa:
    | 'preparacion'
    | 'historias-clinicas'
    | 'enfermeria'
    | 'prefactura'
    | 'soportes-requeridos'
    | 'finalizacion'
    | 'completo';
  completados: number;
  total: number | null;
  grupoActual: number | null;
  porcentajeGeneral?: number;
}

export interface AvisoReporte {
  tipo:
    | 'recalculo-ingreso'
    | 'ordenes-sin-confirmar'
    | 'enfermeria-sin-notas'
    | 'historias-sin-folios'
    | 'prefactura-sin-servicios'
    | 'prefactura-no-disponible';
  ingreso: string;
  fecha: string;
  mensaje: string;
  ordenes: string[];
}

export interface EjecucionReportes {
  proceso?: ProcesoReportes;
  posicionCola?: number;
  enColaDesde?: string;
  loteId?: string;
  disponibleParaProceso: boolean;
  documentosPendientes: TipoDocumentoReporte[];
  avisos?: AvisoReporte[];
  fallas?: NonNullable<EjecucionReportes['fallo']>[];
  fallasPendientes?: NonNullable<EjecucionReportes['fallo']>[];
  reanudable?: boolean;
  fallo?: {
    fecha: string;
    mensaje: string;
    paso: string;
    etapa: string;
    grupo: number | null;
    totalGrupos: number | null;
    detalle: string;
  };
  id: string;
  documento: string;
  ingreso: string;
  createdAt: string;
  updatedAt: string;
  estado: 'queued' | 'starting' | 'running' | 'complete' | 'failed' | 'prefactura-unavailable';
  mensaje: string;
  archivos: ArchivoReporte[];
  progreso?: ProgresoReportes;
}

export interface ColaReportes {
  trabajos: EjecucionReportes[];
  totalEnCola: number;
  resumen: {
    total: number;
    procesados: number;
    enCurso: number;
    pendientes: number;
    porcentaje: number;
  };
}

export interface HistorialReportes {
  reportes: EjecucionReportes[];
  total: number;
  pagina: number;
  porPagina: number;
}

export interface FiltrosHistorialReportes {
  documento?: string;
  ingreso?: string;
  proceso?: ProcesoReportes | 'anteriores';
  archivo?: string;
  busqueda?: string;
}
