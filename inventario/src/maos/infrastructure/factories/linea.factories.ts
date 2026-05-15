import { LineaRes, OfertaSetRes } from '@inn/maos/application/responses';
import { LineaOrm, OfertaOrm } from '@inn/orm/inn/maos';

export const dataToLineaRes = (linea: LineaOrm, ofertas: OfertaOrm[]): LineaRes => {
  const res: LineaRes = {
    id: linea.id,
    nombre: linea.nombre,
    clasificaciones: linea.clasificaciones.map(clasificacion => {
      const clasificacionRes = {
        id: clasificacion.id,
        nombre: clasificacion.nombre,
        sets: clasificacion.sets.map(set => {
          const ofertasRes = ofertas
            .filter(o => o.setId === set.id)
            .map(o => {
              return {
                id: o.id,
                proveedor: {
                  id: o.proveedor.id,
                  codigo: o.proveedor.terNumDoc,
                  nombre: o.proveedor.nombreTercero,
                },
                productos: o.detalle.map(d => {
                  const producto = set.productos.find(p => p.id === d.productoId);
                  return {
                    id: d.id,
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    cantidad: producto.cantidad,
                    precioUnitario: d.precioUnitario,
                  };
                }),
              };
            });

          return {
            id: set.id,
            nombre: set.nombre,
            productos: set.productos.map(producto => {
              return {
                id: producto.id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                cantidad: producto.cantidad,
              };
            }),
            ofertas: ofertasRes,
          };
        }),
      };

      return clasificacionRes;
    }),
  };

  return res;
};
