import { Injectable } from '@nestjs/common';
import { existenciaActualQuery } from '../queries';
import { BaseSource } from '@common/infrastructure/services';
import { PDTExistenciaActualGI, PDTExistenciaActualI } from '../responses/existencias';
import { GCM_CONTEXTS, GCM_CONTEXTS_VALUES } from '@common/domain/types';
import { cloneDeep } from 'lodash';

@Injectable()
export class ExistenciasImpl extends BaseSource {
  public async fetchExistenciaActualAllCentrosByPattern(
    pattern: string
  ): Promise<PDTExistenciaActualGI[]> {
    const CONTEXTS = GCM_CONTEXTS_VALUES.filter(
      c => [GCM_CONTEXTS.DEVELOPMENT, GCM_CONTEXTS.EKLIPSE].indexOf(c) < 0
    );

    const productos: PDTExistenciaActualGI[] = [];

    for (let index = 0; index < CONTEXTS.length; index++) {
      const context = CONTEXTS[index];
      const qr = this.dynamicQR(context);
      await qr.connect();
      try {
        if (!pattern) throw new Error('Debe agregar un pattern');

        const result: PDTExistenciaActualI[] = await qr.query(
          existenciaActualQuery({
            context,
            pattern,
            filterByAlmacenFarmacia: true,
            maxLength: 10,
          })
        );

        result.map(r => {
          r.context = context;
          const prodWithSameCode = productos.filter(
            p => p.codigoAgrupamiento === r.codigoAgrupamiento
          );

          if (!prodWithSameCode.length) {
            r.detalle = [cloneDeep(r)];
            productos.push({
              codigoAgrupamiento: r.codigoAgrupamiento,
              nombreAgrupamiento: r.nombreAgrupamiento,
              existenciaActual: 0,
              data: [r],
            });
          } else {
            const prodWithSameCodeAndCtx = prodWithSameCode[0].data.filter(
              p => p.codigoAgrupamiento === r.codigoAgrupamiento && p.context === context
            );

            if (!prodWithSameCodeAndCtx.length) {
              r.detalle = [cloneDeep(r)];
              productos.filter(p => p.codigoAgrupamiento === r.codigoAgrupamiento)[0].data.push(r);
            } else {
              prodWithSameCodeAndCtx[0].existenciaActual += r.existenciaActual;
              prodWithSameCodeAndCtx[0].detalle.push(r);
            }
          }
        });
      } catch (error) {
        throw new Error(error.message);
      } finally {
        await qr.release();
      }
    }

    productos.map(p => {
      p.data.map(d => {
        p.existenciaActual += d.existenciaActual;
        delete d.codigoAgrupamiento;
        delete d.nombreAgrupamiento;
        delete d.almacenId;
        delete d.almacenNombre;
        d.valorTotal = d.costoPromedio * d.existenciaActual;
        d.detalle.map(dt => {
          delete dt.codigoAgrupamiento;
          delete dt.nombreAgrupamiento;
          delete dt.almacenId;
          delete dt.stockMinimo;
          delete dt.stockMaximo;
          delete dt.puntoReposicion;
          delete dt.context;
          dt.valorTotal = dt.costoPromedio * dt.existenciaActual;
          delete dt.costoPromedio;
        });
      });
    });

    return productos;
  }
}
