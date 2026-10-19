export interface EstacionServicioRead {
  id: number;
  nombre: string;
  direccion: string;
  observaciones?: string;
  municipio?: any;
  ubicacion?: any;
  activa: boolean;
  creadaPorUsuario?: any;
  createdAt: Date;
  updatedAt: Date;
}
