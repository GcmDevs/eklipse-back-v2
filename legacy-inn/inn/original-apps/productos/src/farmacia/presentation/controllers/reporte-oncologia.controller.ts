import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { AlmacenCentroOrm } from '@inn/orm/inn/producto/almacen-centro.orm';
import { INN_AUTHORITIES } from '@inn/old/authorities/inventario';
import { BaseSource } from '@common/infrastructure/services';
import { OncoDataI, QUERY_REPO_ONCO } from './shared';
import { CentroOrm } from '@inn/orm/adn';
import { clone } from 'lodash';
import { groupByKey } from '@common/application/services';

@ApiTags('V1 - Reportes almacen')
@CommonGuards()
@Controller('v1/inn/pdt/reportes')
export class ReporteOncologiaController extends BaseSource {
  @Authorities([INN_AUTHORITIES.PRODUCTOS.GESTION_REPORTES])
  @Get('oncologia/actual')
  public async getUsoPorMes() {
    const contexts = [this.auth.context, GCM_CONTEXTS.AMMEDICAL];

    const results: { context: GcmContextType; data: OncoDataI[] }[] = [];

    for (let index = 0; index < contexts.length; index++) {
      const ctx = contexts[index];
      const ds = this.dynamicQR(ctx);
      const data: OncoDataI[] = await ds.query(QUERY_REPO_ONCO(true, ctx));

      let almacenesByCentro: AlmacenCentroOrm[];

      if (ctx === GCM_CONTEXTS.ALTACENTRO) {
        const almacentroRp = ds.manager.getRepository(AlmacenCentroOrm);
        const centroRp = ds.manager.getRepository(CentroOrm);
        const centros = await centroRp.find();
        almacenesByCentro = await almacentroRp.find();
        almacenesByCentro.map(a => {
          if (a.centroId) a.centro = centros.filter(c => c.id === a.centroId)[0];
        });
      }

      const dataMerged: OncoDataI[] = [];

      const dataGroupedByCodigoAgrupamiento = groupByKey(
        data.filter(d => d.codigoAgrupamiento),
        'codigoAgrupamiento'
      );

      const dataGroupedByCodigoProducto = groupByKey(
        data.filter(d => !d.codigoAgrupamiento),
        'codigoProducto'
      );

      const dataGrouped = [...dataGroupedByCodigoAgrupamiento, ...dataGroupedByCodigoProducto];

      dataGrouped.forEach((d, i) => {
        let existencias = 0;
        d.rows.forEach(e => {
          existencias += e.existencias;
        });
        const item = clone(d.rows[0]);
        if (ctx === GCM_CONTEXTS.ALTACENTRO && item.idAlmacen) {
          const d = almacenesByCentro.filter(abc => abc.almacenId === item.idAlmacen)[0];
          item.contexto = d.centroId === 1 ? 'MEDICOS_CENTRO' : 'ALTA_COMPLEJIDAD';
        } else {
          item.contexto = ctx.getCode();
        }
        item.existencias = existencias;
        if (!item.codigoAgrupamiento) {
          item.codigoAgrupamiento = item.codigoProducto;
          item.nombreAgrupamiento = item.nombreProducto;
          item.isByAgrupamiento = false;
        } else {
          item.isByAgrupamiento = true;
        }
        dataMerged.push(item);
      });

      results.push({ context: ctx, data: dataMerged });
    }

    const items: OncoDataI[] = [];

    results.forEach(r => {
      r.data.forEach(d => {
        const el = items.filter(i => i.codigoAgrupamiento === d.codigoAgrupamiento);
        if (!el.length) {
          if (r.context === GCM_CONTEXTS.ALTACENTRO) {
            if (d.contexto === 'MEDICOS_CENTRO') d['ALTA_COMPLEJIDAD'] = 0;
            if (d.contexto === 'ALTA_COMPLEJIDAD') d['MEDICOS_CENTRO'] = 0;
          }
          d[`${d.contexto}`] = d.existencias;
          delete d.existencias;
          items.push(d);
        } else {
          if (r.context === GCM_CONTEXTS.ALTACENTRO) {
            if (el[0].contexto === 'MEDICOS_CENTRO') el[0]['ALTA_COMPLEJIDAD'] = 0;
            if (el[0].contexto === 'ALTA_COMPLEJIDAD') el[0]['MEDICOS_CENTRO'] = 0;
          }
          el[0][`${d.contexto}`] = d.existencias;
        }
      });
    });

    return items;
  }
}
