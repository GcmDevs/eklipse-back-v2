export interface CategoriaResponse {
  categoriaId: number;
  nombre: string | null;
  estado: number;

  productos: {
    productoId: number;
    codigo: string | null;
    nombre: string | null;
    estado: number;
    cantidadTotal2025: number | null;
  }[];

  proveedores: {
    proveedorId: number;
    documento: string | null;
    nombre: string | null;
    estado: number;
  }[];

  ofertas: {
    ofertaId: number;
    estado: number;
    fechaOferta: string | null;

    categoriaId: number | null;
    productoId: number | null;
    proveedorId: number | null;

    // (opcionales para pintar en UI sin lookup)
    productoCodigo?: string | null;
    productoNombre?: string | null;
    proveedorDocumento?: string | null;
    proveedorNombre?: string | null;

    principio: string | null;
    concentracion: string | null;
    marca: string | null;
    expediente: string | null;
    concecutivo: string | null;
    registroSanitario: string | null;
    fechaVencimientoRegistro: string | null;
    estadoRegistro: string | null;
    clasificacionRiesgo: string | null;

    precioUnitario: string | null;
    iva: string | null;
    presentacion: string | null;
    precioPresentacion: string | null;
    regulado: string | null;

    documentos: {
      documentoId: number;
      proveedorId: number | null;
      docId: string | null;
      nombreArchivo: string | null;
      mimeType: string | null;
      tamanioBytes: number | null;
      ruta: string | null;
      fechaCarga: string | null;
    }[];
  }[];
}
