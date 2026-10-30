export interface EstacionServicioRead {
  id: number;
  nombre: string;
  direccion: string;
  nit?: string | null;
  observaciones?: string;
  municipio?: any;
  ubicacion?: any;
  activa: boolean;
  creadaPorUsuario?: any;
  createdAt: Date;
  updatedAt: Date;
}
