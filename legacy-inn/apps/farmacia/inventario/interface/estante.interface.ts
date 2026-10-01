export interface EstanteResponse {
  id: number;
  nombreEstante: string;
  estado: string;
  numeroConteoActual?: number;
  numeroConteoUnoRealizado?: boolean;
  numeroConteoDosRealizado?: boolean;
  cicloId: number | null;
  almacen: {
    id: number;
    nombre: string;
  };
  productos: ProductoEstanteResponse[];
}
export interface ProductoEstanteResponse {
  id: number;
  stock: number;
  ubicacion: string;
  tipo: string;
  conteosRealizados: number[];
  siguienteConteoPermitido: number | null;
  estadoConteoActual: 'PENDIENTE' | 'YA_CONTADO' | 'BLOQUEADO';
  requiereConteoActual: boolean;
  conteoRequerido: number | null;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    fabricante?: string;
    agrupamiento?: string;
    codigoAgrupamiento?: string;
    existenciasTotal?: number;
  };
}

export interface Estante {
  id: number;
  nombreEstante: string;
  almacenId: number;
  createdAt: Date | null;
  updatedAt: Date | null;
  productos: ProductoElement[];
  almacen: Almacen;
}

export interface Almacen {
  id: number;
  codigo: string;
  nombre: string;
  prefijo?: string;
}

export interface ProductoElement {
  id: number;
  estanteId: number;
  productId: number;
  stock: number;
  ubicacion: string;
  isActivo: boolean;
  createdAt: Date;
  updatedAt: Date;
  producto: ProductoProducto;
}

export interface ProductoProducto {
  id: number;
  codigo: string;
  descripcion: string;
  agrupamientoId: number;
  grupoId: number;
  claseCode: number;
  tipoCode: number;
  riesgoCode: number;
  riesgoSanitarioCode: number;
  isBloqueado: boolean;
  marca: string;
  CUM: null;
  fabricanteId: number;
  precioSugerido: number;
  fabricante: Almacen;
  existencias: Existencia[];
  agrupamiento: Almacen;
}

export interface Existencia {
  id: number;
  almacenId: number;
  productoId: number;
  loteId: null;
  cantidad: number;
}

export interface MisAsignacionesResponse {
  asignacionId: number;
  estanteId: number;
  nombre: string;
  numeroConteo: number;
  estadoEstante: 'PENDIENTE' | 'PROGRESO' | 'COMPLETADO';
  almacenId: number | null;
  nombreAlmacen: string | null;
  cicloId?: number | null;
  cicloNombre?: string | null;
  cicloEstado?: string | null;
}
