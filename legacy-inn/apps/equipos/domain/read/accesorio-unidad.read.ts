import { EstadoAccesorioUnidad } from '@equipos/domain/enums';

export interface AccesorioUnidadRead {
  id: number;
  equipoId: number;
  accesorioEstandarId: number;
  parteSnap: string;
  estado: EstadoAccesorioUnidad;
  observaciones?: string;
  marcaNombre?: string;
  referencia?: string;
  cantidad?: number;
  descontinuado?: boolean;
  fechaDescontinuado?: Date;
  createdAt: Date;
  updatedAt: Date;
}
