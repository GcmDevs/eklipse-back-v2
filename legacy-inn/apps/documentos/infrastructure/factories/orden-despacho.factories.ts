import { OrdenDespachoOrm, TrasladoProductoOrm } from '@orm/inn/documentos';

export const ordenDespachoOrmToOrdenDespachoRes = (data: OrdenDespachoOrm) => {
  return {
    id: data.id,
    consecutivo: data.documento.consecutivo,
    fechaCreacion: data.documento.fechaCreacion,
    fechaConfirmacion: data.documento.fechaConfirmacion,
    fechaAnulacion: data.documento.fechaAnulacion,
    tipoOrdenCode: data.tipoOrdenCode,
    destinoCode: data.destinoCode,
    estadoProductosCode: data.estadoProductosCode,
    estadoEntregaCode: data.estadoEntregaCode,
    detalle: data.detalle.map(dt => {
      return {
        producto: {
          id: dt.producto.id,
          codigo: dt.producto.codigo,
          nombre: dt.producto.descripcion,
        },
        cantidad: dt.cantidad,
        precio: dt.precio,
      };
    }),
  };
};
export const ordenDespachoOrmToTrasladoProductoRes = (data: TrasladoProductoOrm) => {
  return {
    id: data.id,
    consecutivo: data.documento.consecutivo,
    fechaCreacion: data.documento.fechaCreacion,
    fechaConfirmacion: data.documento.fechaConfirmacion,
    fechaAnulacion: data.documento.fechaAnulacion,
    tipoOrdenCode: null,
    destinoCode: null,
    estadoProductosCode: null,
    estadoEntregaCode: null,
    detalle: [],
  };
};
