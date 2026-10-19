export interface ProductoResponse {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string;
  CUM: string;
  fabricante: Agrupamiento;
  existenciaSistema: number;
  agrupamiento: Agrupamiento;
}

export interface Agrupamiento {
  id: number;
  nombre: string;
}
