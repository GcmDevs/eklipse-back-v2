import { INN_AUTHORITIES } from '@authorities/inventario';
import { GcmContexts } from '@common/application/constants';
import { getDateRange, groupByKey } from '@common/application/services';
import { GCM_CONTEXTS, gcmContextFactory, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource, QueryRunner } from 'typeorm';
import { choiceByCtx } from './farmacia/presentation/controllers/shared';
import {
  existenciaActualQuery,
  formatDate,
  salidas,
} from 'inn/original-apps/uso-productos-por-mes';

const query = (date: Date) => {
  const dateFt = formatDate(date, false, false);
  return `SELECT INKFECHA AS FECHA,MONTH(inkfecha) AS MES,
    inngrupo.IGRNOMBRE AS GRUPO,
    INNPRODUC.IPRCODIGO AS COD_PRODUCTO,
    INNPRODUC.IPRDESCOR AS PRODUCTO,
    AGRCODIGO AS COD_AGRUPAMIENTO,
    AGRNOMBRE AS NOM_AGRUPAMIENTO,
    inndocume.idconsec as DOCUMENTO,
    CASE INNDOCUME.IDTIPDOC
        WHEN 0 THEN 'Orden_Compra' WHEN 1 THEN 'Remision_Entrada'
        WHEN 2 THEN 'Comprobante_Entrada'
        WHEN 3 THEN 'Suministro_Paciente'
        WHEN 4 THEN 'Inventario_Inicial'
        WHEN 5 THEN 'Devolucion_Suministro'
        WHEN 6 THEN 'CierreMensual'
        WHEN 7 THEN 'Cotizacion'
        WHEN 8 THEN 'Remision_Salida'
        WHEN 9 THEN 'factura'
        WHEN 10 THEN 'Prestamo_Mercancia'
        WHEN 11 THEN 'Ajuste_Inventario'
        WHEN 12 THEN 'Factura'
        WHEN 13 THEN 'Compromisos'
        WHEN 14 THEN 'Devolucion_Remision'
        WHEN 15 THEN 'Devolucion_Compra'
        WHEN 16 THEN 'Devolucion_Venta'
        WHEN 17 THEN 'Orden_Despacho'
        WHEN 18 THEN 'Contrato'
        WHEN 19 THEN 'Orden_Servicio'
        WHEN 20 THEN 'Orden_Produccion'
        WHEN 21 THEN 'Devolucion_OrdenD'
        WHEN 22 THEN 'Solicitud_Pedido'
        WHEN 23 THEN 'Demanda_Insatisfecha'
        WHEN 24 THEN 'Traslado_Producto_Consignacion'
        WHEN 25 THEN 'Recibo_Orden_Despacho'
        WHEN 26 THEN 'Reclasificacion_Regulados'
        END AS 'TIPO_DOCUMENTO',
    CASE INKTIPMOV
        WHEN 0 THEN INKCANTID
        WHEN 1 THEN ''
        END AS ENTRADA,
    CASE INKTIPMOV
        WHEN 0 THEN ''
        WHEN 1 THEN INKCANTID
        END AS SALIDA
    FROM INKD${dateFt}
        INNER JOIN INNPRODUC ON  INKD${dateFt}.INNPRODUC = INNPRODUC.OID
        INNER JOIN INNDOCUME ON INNDOCUME.OID = INKD${dateFt}.INNDOCUME
        INNER JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
        INNER JOIN INNGRUPO ON INNPRODUC.IGRCODIGO = INNGRUPO.OID
        where AGRCODIGO != '000'
    `;
};

const existenciaActualPorAlmacenQuery = (
  filtrarPorAlmacenes: boolean,
  ctx: GcmContextType,
  pattern?: string
) => {
  return `select ${pattern ? 'TOP (50)' : ''} INNAGRUPAMI.AGRCODIGO COD_AGRUPAMIENTO,
  INNAGRUPAMI.AGRNOMBRE NOM_AGRUPAMIENTO,
IPRCOSTPE as COSTO_PROMEDIO,
IPRULCOPE as ULTIMO_COSTO,
IPRPREVPE as PRECIO_VENTA,
INNALMACE.IALNOMBRE AS ALMACEN,
IPRSTKMIN AS STOCK_MINIMO,
IPRSTKMAX AS STOCK_MAXIMO,
IPRPUNREP AS PUNTO_REPOSICION,
sum(INNFISICO.IFICANTID) as EXISTENCIA_ACTUAL,
(IPRCOSTPE*sum(INNFISICO.IFICANTID)) as VALOR_TOTAL from INNPRODUC 
  inner join INNFISICO on INNFISICO.INNPRODUC=INNPRODUC.oid
  inner join INNALMACE on INNALMACE.OID=INNFISICO.INNALMACE
  left JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
  where ((IFICANTID + IFICANCOMP) > 0) and INNAGRUPAMI.AGRCODIGO != '000'
  ${filtrarPorAlmacenes ? `AND INNFISICO.INNALMACE IN(${choiceByCtx(ctx)})` : ''}
    ${
      pattern
        ? `AND (INNAGRUPAMI.AGRNOMBRE LIKE '%${pattern}%' OR INNAGRUPAMI.AGRCODIGO LIKE '%${pattern}%')`
        : ''
    }
  group by IPRCODIGO,IPRDESCOR,IPRCOSTPE,IALNOMBRE,IPRSTKMIN,IPRSTKMAX,
  IPRPUNREP,INNAGRUPAMI.AGRCODIGO,INNAGRUPAMI.AGRNOMBRE,IPRPREVPE,IPRULCOPE
  ORDER BY IPRCODIGO
  `;
};

interface ReporteRes {
  FECHA: string;
  MES: number;
  GRUPO: string;
  COD_PRODUCTO: string;
  PRODUCTO: string;
  COD_AGRUPAMIENTO: string;
  NOM_AGRUPAMIENTO: string;
  DOCUMENTO: string;
  TIPO_DOCUMENTO: string;
  ENTRADA: number;
  SALIDA: number;
  EXISTENCIA_ACTUAL?: number;
  STOCK_MAXIMO?: number;
  STOCK_MINIMO?: number;
  PUNTO_REPOSICION?: number;
  ALMACEN?: number;
  VALOR_TOTAL?: number;
  PRECIO_VENTA?: number;
  COSTO_PROMEDIO?: number;
  PROMEDIO_CONSUMO?: number;
  ULTIMO_COSTO?: number;
}

interface ExistActualRes {
  COD_AGRUPAMIENTO: string;
  NOM_AGRUPAMIENTO: string;
  COSTO_PROMEDIO: number;
  STOCK_MINIMO: number;
  STOCK_MAXIMO: number;
  EXISTENCIA_ACTUAL: number;
  PUNTO_REPOSICION: number;
  VALOR_TOTAL: number;
}

@ApiTags('v1 - Inventario (Productos)')
@CommonGuards()
@Controller('v1/inn/pdt/reportes')
export class ReporteActualController extends BaseSource {
  public async getUsoPorMes(inicio: Date, fin: Date, context: GcmContexts, isNotResumido: boolean) {
    inicio = new Date(`${inicio}:00:00`);
    fin = new Date(`${fin}:00:00`);

    if (isNotResumido === undefined) isNotResumido = true;

    let qr: QueryRunner;

    if (context) qr = this.dynamicQR(gcmContextFactory(context));
    else qr = this.qr;

    await qr.connect();

    const results: {
      mes: string;
      mesForHumans: string;
      data: ReporteRes[];
      existenciasPorAlmacen: ReporteRes[];
    }[] = [];

    try {
      const dateRanges = getDateRange(inicio, fin);

      const monthInMs = 2592000000;

      const mesesPosteriores = [
        new Date(inicio.getTime() - monthInMs * 1),
        new Date(inicio.getTime() - monthInMs * 2),
      ];

      let salidasPrevias = [];

      if (isNotResumido) {
        for (let i = 0; i < mesesPosteriores.length; i++) {
          let res = await qr.query(salidas(mesesPosteriores[i]));
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

      for (let i = 0; i < dateRanges.length; i++) {
        try {
          const response: ReporteRes[] = await qr.query(query(dateRanges[i].start));

          const result = response.filter(
            el =>
              el.MES === dateRanges[i].start.getMonth() + 1 && (el.ENTRADA !== 0 || el.SALIDA !== 0)
          );

          let existenciasActuales: ExistActualRes[] = [];

          existenciasActuales = await qr.query(existenciaActualQuery(false, this.auth.context));

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
              rs.STOCK_MAXIMO = existenciaActual[0].STOCK_MAXIMO;
              rs.STOCK_MINIMO = existenciaActual[0].STOCK_MINIMO;
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

          const existenciasPorAlmacen = await qr.query(
            existenciaActualPorAlmacenQuery(isNotResumido ? false : true, this.auth.context)
          );

          results.push({
            mes: formatDate(dateRanges[i].start, true, false),
            mesForHumans: formatDate(dateRanges[i].start, false, true),
            data: result,
            existenciasPorAlmacen,
          });
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }

    return results;
  }

  @Authorities([INN_AUTHORITIES.PRODUCTOS.GESTION_REPORTES])
  @Get('uso-mes/actual/:inicio/:fin')
  public async getUsoPorMesForLocal(
    @Param('inicio') inicio: Date,
    @Param('fin') fin: Date,
    @Query('context') context: GcmContexts,
    @Query('isNotResumido') isNotResumido: boolean
  ) {
    return this.getUsoPorMes(inicio, fin, context, isNotResumido);
  }

  @Authorities([INN_AUTHORITIES.PRODUCTOS.GESTION_REPORTES])
  @Get('existencias-actuales')
  public async existenciasActuales(@Query('pattern') pattern: string) {
    try {
      if (!pattern) throw new Error('Debe agregar un pattern');
      const result = await this.conn.query(existenciaActualQuery(true, this.auth.context, pattern));

      const existenciasPorAlmacen = await this.conn.query(
        existenciaActualPorAlmacenQuery(true, this.auth.context, pattern)
      );

      existenciasPorAlmacen.map(data => {
        if (this.auth.context === GCM_CONTEXTS.ALTACENTRO) {
          if (data.ALMACEN === 'FARMACIA') data.ALMACEN = 'FARMACIA MEDICO CENTRO';
        }
      });

      return [
        {
          mes: formatDate(new Date(), true, false),
          mesForHumans: formatDate(new Date(), false, true),
          data: result,
          existenciasPorAlmacen,
        },
      ];
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
