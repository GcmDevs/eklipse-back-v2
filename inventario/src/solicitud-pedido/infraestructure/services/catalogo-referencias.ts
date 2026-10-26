import { In, QueryRunner } from 'typeorm';
import { ProductoOrm } from '@inn/orm/inn/productos';

export interface ReferenciaDespachoResponse {
  productoId: number;
  codigo: string;
  descripcion: string;
  existenciaDinamica: number;
  productoEncontrado: boolean;
}

export async function cargarReferenciasDespacho(
  qr: QueryRunner,
  productos: { agrupamientoId: number | null; referencias: ReferenciaDespachoResponse[] }[]
): Promise<void> {
  const ids = [...new Set(productos.map(producto => producto.agrupamientoId).filter(Boolean))];
  if (!ids.length) return;
  const hijos: ProductoOrm[] = [];
  for (let i = 0; i < ids.length; i += 1000) {
    hijos.push(
      ...(await qr.manager.getRepository(ProductoOrm).find({
        where: { agrupamientoId: In(ids.slice(i, i + 1000)) },
        order: { codigo: 'ASC' },
      }))
    );
  }
  productos.forEach(producto => {
    if (!producto.agrupamientoId) return;
    producto.referencias = hijos
      .filter(hijo => hijo.agrupamientoId === producto.agrupamientoId && !hijo.isBloqueado)
      .map(hijo => ({
        productoId: hijo.id,
        codigo: hijo.codigo.trim(),
        descripcion:
          hijo.descripcionLarga?.trim() || hijo.descripcionCorta?.trim() || hijo.codigo.trim(),
        existenciaDinamica: 0,
        productoEncontrado: false,
      }));
  });
}
