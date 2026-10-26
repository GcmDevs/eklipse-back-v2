export interface ArchivoReporte {
  id: string;
  nombre: string;
  bytes: number;
  tipo: 'historias-clinicas' | 'enfermeria' | 'prefactura';
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
    | 'finalizacion'
    | 'completo';
  completados: number;
  total: number | null;
  grupoActual: number | null;
  porcentajeGeneral?: number;
}

export interface EjecucionReportes {
  fallasPendientes?: NonNullable<EjecucionReportes['fallo']>[];
  pendiente?: EjecucionReportes;
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
  estado: 'starting' | 'running' | 'complete' | 'failed' | 'prefactura-unavailable';
  mensaje: string;
  archivos: ArchivoReporte[];
  progreso?: ProgresoReportes;
}
