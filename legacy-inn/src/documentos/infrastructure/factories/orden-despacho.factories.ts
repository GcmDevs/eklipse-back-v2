import {
  destinoOrdenDespachoTypeFactory,
  estadoEntregaOrdenDespachoTypeFactory,
  tipoOrdenDespachoTypeFactory,
} from '@gtypes/inn/orden-despacho';
import { OrdDesFetchPendienteRes } from '../responses';
import { OrdenDespachoOrm } from '@orm/inn/documentos';

export const dataToFetchOrdDescPendienteRes = (el: OrdenDespachoOrm): OrdDesFetchPendienteRes => {
  const res: OrdDesFetchPendienteRes = {
    id: el.id,
    items: el.detalle.map(item => {
      return {
        id: item.id,
        cantidad: item.cantidad,
        cantidadSolicitada: item.cantidadSolicitada,
        cantidadDevuelta: item.cantidadDevuelta,
        cantidadRecibida: item.cantidadRecibida,
        producto: {
          id: item.producto.id,
          codigo: item.producto.codigo,
          descripcionCorta: item.producto.descripcion,
          descripcionLarga: item.producto.descripcionLarga,
        },
      };
    }),
    createdAt: el.documentoRelacionado.documento.fechaCreacion,
    createdBy: {
      cedula: el.documentoRelacionado.documento.creadoPor.cedula,
      nombreCompleto: el.documentoRelacionado.documento.creadoPor.nombreCompleto,
    },
    consecutivo: el.documentoRelacionado.documento.consecutivo,
    tipo: tipoOrdenDespachoTypeFactory(el.tipoOrdenCode) as any,
    destino: destinoOrdenDespachoTypeFactory(el.destinoCode) as any,
    estadoEntrega: estadoEntregaOrdenDespachoTypeFactory(el.estadoEntregaCode) as any,
  };

  if (el.documentoRelacionado) {
    res.createdAt = el.documentoRelacionado.documento.fechaCreacion;
    res.createdBy = {
      cedula: el.documentoRelacionado.documento.creadoPor.cedula,
      nombreCompleto: el.documentoRelacionado.documento.creadoPor.nombreCompleto,
    };
    res.consecutivo = el.documentoRelacionado.documento.consecutivo;
  }
  return res;
};
