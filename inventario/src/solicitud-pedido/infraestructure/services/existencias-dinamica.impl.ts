import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';

import { GCM_CONTEXTS } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { ProductoOrm as ProductoExistenciaOrm } from '@inn/orm/inn/productos/inn';

export interface ExistenciaDinamica {
  cantidad: number;
  productoEncontrado: boolean;
}

export const normalizarCodigoProducto = (codigo: string): string =>
  codigo?.trim().toUpperCase() ?? '';

@Injectable()
export class ExistenciasDinamicaImpl extends BaseSource {
  async obtenerPorCodigos(codigos: string[]): Promise<Map<string, ExistenciaDinamica>> {
    const codigosNormalizados = [...new Set(codigos.map(normalizarCodigoProducto))].filter(Boolean);
    const existencias = new Map<string, ExistenciaDinamica>();
    if (!codigosNormalizados.length) return existencias;

    const qr = this.dynamicQR(GCM_CONTEXTS.AMMEDICAL);

    try {
      await qr.connect();

      // SQL Server admite como maximo 2.100 parametros por consulta.
      const cantidadPorLote = 1000;
      for (let inicio = 0; inicio < codigosNormalizados.length; inicio += cantidadPorLote) {
        const codigosLote = codigosNormalizados.slice(inicio, inicio + cantidadPorLote);
        const productos = await qr.manager.getRepository(ProductoExistenciaOrm).find({
          where: { codigo: In(codigosLote) },
          relations: { existencias: true },
        });

        productos.forEach(producto => {
          const codigo = normalizarCodigoProducto(producto.codigo);
          const cantidad = (producto.existencias ?? []).reduce(
            (total, existencia) => total + Number(existencia.cantidad ?? 0),
            0
          );
          const existenciaActual = existencias.get(codigo);

          existencias.set(codigo, {
            cantidad: (existenciaActual?.cantidad ?? 0) + cantidad,
            productoEncontrado: true,
          });
        });
      }

      existencias.forEach(existencia => {
        existencia.cantidad = Math.max(0, existencia.cantidad);
      });

      return existencias;
    } catch (error: any) {
      throw new Error(`No fue posible validar existencias en Dinamica: ${error.message}`);
    } finally {
      await qr.release();
    }
  }
}
