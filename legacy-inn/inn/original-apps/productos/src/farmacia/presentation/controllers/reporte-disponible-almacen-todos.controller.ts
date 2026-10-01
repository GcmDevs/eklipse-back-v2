import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { GCM_CONTEXTS, GCM_CONTEXTS_VALUES } from '@common/domain/types';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@inn/old/authorities/inventario';
import { OncoDataI, QUERY_REPO_ONCO } from './shared';
import { AlmacenCentroOrm } from '@inn/orm/inn';
import { CentroOrm } from '@inn/orm/adn';
import { clone } from 'lodash';
import { groupByKey } from '@common/application/services';
import { ReporteActualController } from './reporte-actual.controller';

@ApiTags('V1 - Reportes almacen')
@CommonGuards()
@Controller('v1/inn/pdt/reportes')
export class ReporteDisponibleTodosController extends ReporteActualController {
  @Authorities([INN_AUTHORITIES.PRODUCTOS.GESTION_REPORTES])
  @Get('todos/actual')
  public async getUsoPorMesLocal(@Query('isOncologia') isOncologia: boolean) {
    const contexts = !isOncologia
      ? GCM_CONTEXTS_VALUES.filter(
          c => [GCM_CONTEXTS.DEVELOPMENT, GCM_CONTEXTS.EKLIPSE].indexOf(c) < 0
        )
      : [this.auth.context, GCM_CONTEXTS.AMMEDICAL];

    const results: { context: string; data: OncoDataI[] }[] = [];

    const previousDate = new Date(new Date().setMonth(new Date().getMonth() - 1));

    /* const twoMonthAgo = new Date(
      `${
        previousDate.getMonth() === 0 ? previousDate.getFullYear() - 1 : previousDate.getFullYear()
      }-${previousDate.getMonth() === 0 ? 12 : previousDate.getMonth()}-15`
    );
    const oneMonthAgo = new Date(
      `${new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()}-${
        new Date().getMonth() === 0 ? 12 : new Date().getMonth()
      }-15`
    ); */

    for (let index = 0; index < contexts.length; index++) {
      const ctx = contexts[index];

      /* const dataForPromedio = await this.getUsoPorMes(
        twoMonthAgo.toISOString().split('T')[0] as any,
        oneMonthAgo.toISOString().split('T')[0] as any,
        ctx.getCode()
      ); */

      const ds = this.dynamicQR(ctx);

      await ds.connect();

      let data: OncoDataI[];

      try {
        data = await ds.query(QUERY_REPO_ONCO(isOncologia ? true : false, ctx));

        let almacenesByCentro: AlmacenCentroOrm[];

        if (ctx === GCM_CONTEXTS.ALTACENTRO) {
          const almacentroRp = ds.manager.getRepository(AlmacenCentroOrm);
          const centroRp = ds.manager.getRepository(CentroOrm);
          const centros = await centroRp.find();
          almacenesByCentro = await almacentroRp.find();
          almacenesByCentro.map(a => {
            if (a.centroId) a.centro = centros.filter(c => c.id === a.centroId)[0];
          });

          data.map(d => {
            d.contexto =
              almacenesByCentro.filter(a => a.almacenId === d.idAlmacen)[0].centroId === 1
                ? 'MEDICOS_CENTRO'
                : 'ALTA_COMPLEJIDAD';
          });
        } else {
          data.map(d => (d.contexto = ctx.getCode()));
        }
      } catch (error) {
        throw new BadRequestException(error.message);
      } finally {
        await ds.release();
      }

      const dataGroupedByCtx = groupByKey(data, 'contexto');

      dataGroupedByCtx.forEach(dg => {
        const dataGroupedByCodigoAgrupamiento = groupByKey(
          dg.rows.filter(d => d.codigoAgrupamiento),
          'codigoAgrupamiento'
        );

        const dataGroupedByCodigoProducto = groupByKey(
          dg.rows.filter(d => !d.codigoAgrupamiento),
          'codigoProducto'
        );

        const dataGrouped = [...dataGroupedByCodigoAgrupamiento, ...dataGroupedByCodigoProducto];

        dataGrouped.forEach(d => {
          let existencias = 0;
          d.rows.forEach(e => {
            existencias += e.existencias;
          });
          const item = clone(d.rows[0]);
          item.existencias = existencias;
          if (!item.codigoAgrupamiento) {
            item.codigoAgrupamiento = item.codigoProducto;
            item.nombreAgrupamiento = item.nombreProducto;
            item.isByAgrupamiento = false;
          } else {
            item.isByAgrupamiento = true;
          }

          /* if (dataForPromedio.length) {
            dataForPromedio[0].data.forEach(dfp => {
              if (item.codigoAgrupamiento === dfp.COD_AGRUPAMIENTO) {
                item.promedioConsumo = dfp.PROMEDIO_CONSUMO;
              }
            });
          } */
          item.promedioConsumo = 0;

          results.push({ context: dg.key, data: [item] });
        });
      });
    }

    const items: OncoDataI[] = [];

    results.forEach(r => {
      r.data.forEach(d => {
        const el = items.filter(i => i.codigoAgrupamiento === d.codigoAgrupamiento);
        if (!el.length) {
          d[`${d.contexto}`] = d.existencias;
          d[`${d.contexto}_VALOR_UNITARIO`] = d.valorUnitario;
          d[`${d.contexto}_VALOR_TOTAL`] = d.valorUnitario * d.existencias;
          d[`${d.contexto}_PROMEDIO_CONSUMO`] = d.promedioConsumo;
          delete d.existencias;
          items.push(d);
        } else {
          el[0][`${d.contexto}`] = d.existencias;
          el[0][`${d.contexto}_VALOR_UNITARIO`] = d.valorUnitario;
          el[0][`${d.contexto}_VALOR_TOTAL`] = d.valorUnitario * d.existencias;
          el[0][`${d.contexto}_PROMEDIO_CONSUMO`] = d.promedioConsumo;
        }
      });
    });

    return items;
  }
}
