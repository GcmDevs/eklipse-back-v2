import { INN_AUTHORITIES } from '@authorities/inventario';
import { getDateRange, groupByKey } from '@common/application/services';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ExistActualRes,
  existenciaActualQuery,
  formatDate,
  query,
  ReporteRes,
  salidas,
} from 'inn/original-apps/uso-productos-por-mes';
import { DataSource } from 'typeorm';

@ApiTags('V1 - Central de compras (Cotizaciones prefabricadas)')
@CommonGuards()
@Controller('v1/inn/ctc/ctpf/cotizaciones')
export class EstadisticaController extends BaseSource {
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.COTI_PREFABRI])
  @Get(':inicio/:fin')
  public async getUsoPorMes(
    @Param('inicio') inicio: Date,
    @Param('fin') fin: Date,
    @Query('context') context: GcmContextCode,
    @Query('grupoId') grupoId: number,
    @Query('isNotResumido') isNotResumido: boolean
  ) {
    inicio = new Date(`${inicio}:00:00`);
    fin = new Date(`${fin}:00:00`);
    grupoId = +grupoId;

    if (isNotResumido === undefined) isNotResumido = true;

    let conn: DataSource;

    if (context) conn = this.dynamicConn(gcmContextFactory(context));
    else conn = this.conn;

    const dateRanges = getDateRange(inicio, fin);

    const monthInMs = 2592000000;

    const mesesPosteriores = [
      new Date(inicio.getTime() - monthInMs * 1),
      new Date(inicio.getTime() - monthInMs * 2),
    ];

    let salidasPrevias = [];

    if (isNotResumido) {
      for (let i = 0; i < mesesPosteriores.length; i++) {
        let res = await conn.query(salidas(mesesPosteriores[i]));
        res = res.filter(el => el.MES == mesesPosteriores[i].getMonth() + 1);

        res.forEach(r => {
          const salPrev = salidasPrevias.filter(f => f.COD_AGRUPAMIENTO === r.COD_AGRUPAMIENTO);
          if (salPrev.length) {
            salPrev[0].SALIDA += r.SALIDA;
          } else {
            salidasPrevias.push({ COD_AGRUPAMIENTO: r.COD_AGRUPAMIENTO, SALIDA: r.SALIDA });
          }
        });
      }
    }

    const results: {
      mes: string;
      mesForHumans: string;
      data: ReporteRes[];
      existenciasPorAlmacen: ReporteRes[];
    }[] = [];

    for (let i = 0; i < dateRanges.length; i++) {
      try {
        const response: ReporteRes[] = await conn.query(query(dateRanges[i].start, grupoId));

        const result = response.filter(
          el =>
            el.MES === dateRanges[i].start.getMonth() + 1 && (el.ENTRADA !== 0 || el.SALIDA !== 0)
        );

        let existenciasActuales: ExistActualRes[] = [];

        existenciasActuales = await conn.query(existenciaActualQuery(undefined, undefined));

        const existenciaActualGrouped: any = groupByKey(existenciasActuales, 'COD_AGRUPAMIENTO');

        existenciaActualGrouped.map((el: any) => {
          el.COD_AGRUPAMIENTO = el.key;
          el.EXISTENCIA_ACTUAL = 0;
          el.STOCK_MAXIMO = 0;
          el.STOCK_MINIMO = 0;
          el.PUNTO_REPOSICION = 0;
          el.VALOR_TOTAL = 0;

          el.rows.forEach((ea: any) => {
            el.EXISTENCIA_ACTUAL += ea.EXISTENCIA_ACTUAL;
            el.STOCK_MAXIMO += ea.STOCK_MAXIMO;
            el.STOCK_MINIMO += ea.STOCK_MINIMO;
            el.PUNTO_REPOSICION += ea.PUNTO_REPOSICION;
            el.VALOR_TOTAL += ea.VALOR_TOTAL;
          });

          delete el.key;
          delete el.name;
          delete el.rows;
        });

        result.map(rs => {
          const existenciaActual = existenciaActualGrouped.filter(
            (eag: any) => eag.COD_AGRUPAMIENTO === rs.COD_AGRUPAMIENTO
          );

          if (existenciaActual.length) {
            if (isNotResumido) {
              const salPrev = salidasPrevias.filter(
                sp => sp.COD_AGRUPAMIENTO === rs.COD_AGRUPAMIENTO
              );
              rs.PROMEDIO_CONSUMO = salPrev.length
                ? salPrev[0].SALIDA / mesesPosteriores.length
                : 0;
            }
            rs.EXISTENCIA_ACTUAL = existenciaActual[0].EXISTENCIA_ACTUAL;
            rs.STOCK_MAXIMO = !rs.PROMEDIO_CONSUMO
              ? existenciaActual[0].STOCK_MAXIMO
              : (rs.PROMEDIO_CONSUMO / 2) * 3;
            rs.STOCK_MINIMO = !rs.PROMEDIO_CONSUMO
              ? existenciaActual[0].STOCK_MINIMO
              : rs.PROMEDIO_CONSUMO / 2;
            rs.PUNTO_REPOSICION = existenciaActual[0].PUNTO_REPOSICION;
            rs.VALOR_TOTAL = existenciaActual[0].VALOR_TOTAL;
          } else {
            rs.EXISTENCIA_ACTUAL = 0;
            rs.STOCK_MAXIMO = 0;
            rs.STOCK_MINIMO = 0;
            rs.PUNTO_REPOSICION = 0;
            rs.VALOR_TOTAL = 0;
          }
        });

        results.push({
          mes: formatDate(dateRanges[i].start, true, false),
          mesForHumans: formatDate(dateRanges[i].start, false, true),
          data: result,
          existenciasPorAlmacen: [],
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    return results;
  }
}
