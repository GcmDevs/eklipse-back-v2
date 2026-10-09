export interface ArchivoReporte {
  id: string;
  nombre: string;
  bytes: number;
  tipo: 'historias-clinicas' | 'enfermeria';
  grupo: number;
  totalGrupos: number;
}

export interface EjecucionReportes {
  id: string;
  documento: string;
  ingreso: string;
  createdAt: string;
  updatedAt: string;
  estado: 'starting' | 'running' | 'complete' | 'failed';
  mensaje: string;
  archivos: ArchivoReporte[];
}
