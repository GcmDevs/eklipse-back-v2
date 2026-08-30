import { dateUtilities, groupByKey } from '@common/application/services';
import { GcmContextType } from '@common/domain/types';
import { BadRequestException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { choiceByCtx } from './shared';

export interface SalidaI {
  MES?: number;
  COD_AGRUPAMIENTO: string;
  SALIDA: number;
}

export interface ReporteRes {
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
  CALCULADO_FROM_PROMEDIO_CONSUMO: boolean;
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

export interface ExistActualRes {
  COD_AGRUPAMIENTO: string;
  NOM_AGRUPAMIENTO: string;
  COSTO_PROMEDIO: number;
  STOCK_MINIMO: number;
  STOCK_MAXIMO: number;
  EXISTENCIA_ACTUAL: number;
  PUNTO_REPOSICION: number;
  VALOR_TOTAL: number;
}

export const formatDate = (date: Date, add_: boolean, forHumans: boolean) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthFt = month <= 9 ? `0${month}` : month;

  const dateFt = !forHumans ? `${year}${add_ ? '-' : ''}${monthFt}` : `${monthFt}/${year}`;

  return dateFt;
};

export const salidas = (date: Date) => {
  const dateFt = formatDate(date, false, false);
  return `SELECT MONTH(inkfecha) AS MES,
    AGRCODIGO AS COD_AGRUPAMIENTO,
    CASE INKTIPMOV
        WHEN 0 THEN ''
        WHEN 1 THEN INKCANTID
        END AS SALIDA
    FROM INKD${dateFt}
        INNER JOIN INNPRODUC ON  INKD${dateFt}.INNPRODUC = INNPRODUC.OID
        INNER JOIN INNDOCUME ON INNDOCUME.OID = INKD${dateFt}.INNDOCUME
        INNER JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
        INNER JOIN INNGRUPO ON INNPRODUC.IGRCODIGO = INNGRUPO.OID
        where AGRCODIGO != '000' AND INKTIPMOV = 1
        --AND INNAGRUPAMI.AGRCODIGO in('73150', '60003')

    `;
};

export const query = (date: Date, grupoId: number) => {
  const dateFt = formatDate(date, false, false);
  return `SELECT INKFECHA AS FECHA,MONTH(inkfecha) AS MES,
      inngrupo.IGRNOMBRE AS GRUPO,
      INNPRODUC.IPRCODIGO AS COD_PRODUCTO,
      INNPRODUC.IPRDESCOR AS PRODUCTO,
      INNPRODUC.OID AS ID_PRODUCTO,
      AGRCODIGO AS COD_AGRUPAMIENTO,
      AGRNOMBRE AS NOM_AGRUPAMIENTO,
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
          AND inngrupo.IGRNOMBRE IN(
          'ELEMENTOS DE ASEO Y LAVANDERIA',
          'MEDICAMENTOS',
          'MATERIAL MEDICO-QUIRURGICO',
          'PAPELERIA Y UTENSILIOS DE ESCRITORIO',
          'ARRIENDO EQUIPO')
          --AND INNAGRUPAMI.AGRCODIGO in('73150', '60003')
          ${grupoId && grupoId !== 999 ? ` AND inngrupo.OID =  ${grupoId}` : ''}
      `;
};

export const existenciaActualQuery = (
  filtrarPorAlmacenes: boolean,
  ctx: GcmContextType,
  pattern?: string
) => {
  return `select ${pattern ? 'TOP (50)' : ''}
    INNAGRUPAMI.AGRCODIGO COD_AGRUPAMIENTO,
    INNAGRUPAMI.AGRNOMBRE NOM_AGRUPAMIENTO,
    IPRCOSTPE as COSTO_PROMEDIO,
    IPRSTKMIN AS STOCK_MINIMO,
    IPRSTKMAX AS STOCK_MAXIMO,
    IPRPUNREP AS PUNTO_REPOSICION,
    sum(INNFISICO.IFICANTID) as EXISTENCIA_ACTUAL,
    (IPRCOSTPE*sum(INNFISICO.IFICANTID)) as VALOR_TOTAL from INNPRODUC 
    left join INNFISICO on INNFISICO.INNPRODUC=INNPRODUC.oid
    inner JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
    where  ((IFICANTID + IFICANCOMP) > 0) and INNAGRUPAMI.AGRCODIGO != '000'
    --AND INNAGRUPAMI.AGRCODIGO in('73150', '60003')
    ${
      pattern
        ? `AND INNAGRUPAMI.AGRNOMBRE LIKE '%${pattern}%' OR INNAGRUPAMI.AGRCODIGO LIKE '%${pattern}%'`
        : ''
    }
    ${filtrarPorAlmacenes ? `AND INNFISICO.INNALMACE IN(${choiceByCtx(ctx)})` : ''}
    group by 
    IPRDESCOR,IPRCOSTPE,IPRSTKMIN,IPRSTKMAX,IPRPUNREP,AGRCODIGO,AGRNOMBRE
    ORDER BY 2
    `;
};

export const getUsoPorMes = async (
  inicio: Date,
  fin: Date,
  grupoId: number,
  qr?: QueryRunner,
  closeQr?: boolean,
  conn?: DataSource
) => {
  try {
    const localConn = qr ? qr : conn;

    grupoId = +grupoId;

    const dateRanges = dateUtilities.getDateRange(inicio, fin);

    const monthInMs = 2592000000;

    const mesesPosteriores = [
      new Date(inicio.getTime() - monthInMs * 1),
      new Date(inicio.getTime() - monthInMs * 2),
    ];

    let salidasPrevias: SalidaI[] = [];

    for (let i = 0; i < mesesPosteriores.length; i++) {
      let res: SalidaI[] = await localConn.query(salidas(mesesPosteriores[i]));
      res = res.filter(el => el.MES == mesesPosteriores[i].getMonth() + 1);

      res.forEach(r => {
        const salPrev = salidasPrevias.filter(f => f.COD_AGRUPAMIENTO === r.COD_AGRUPAMIENTO);
        if (salPrev.length) salPrev[0].SALIDA += r.SALIDA;
        else salidasPrevias.push({ COD_AGRUPAMIENTO: r.COD_AGRUPAMIENTO, SALIDA: r.SALIDA });
      });
    }

    const results: {
      mes: string;
      mesForHumans: string;
      data: ReporteRes[];
      existenciasPorAlmacen: ReporteRes[];
    }[] = [];

    for (let i = 0; i < dateRanges.length; i++) {
      try {
        const response: ReporteRes[] = await localConn.query(query(dateRanges[i].start, grupoId));

        const result = response.filter(
          el =>
            el.MES === dateRanges[i].start.getMonth() + 1 && (el.ENTRADA !== 0 || el.SALIDA !== 0)
        );

        let existenciasActuales: ExistActualRes[] = [];

        existenciasActuales = await localConn.query(existenciaActualQuery(undefined!, undefined!));

        const existenciaActualGrouped: any = groupByKey(existenciasActuales, 'COD_AGRUPAMIENTO');

        existenciaActualGrouped.map((el: any) => {
          el.COD_AGRUPAMIENTO = el.key;
          el.EXISTENCIA_ACTUAL = 0;
          el.STOCK_MAXIMO = 0;
          el.STOCK_MINIMO = 0;
          el.PUNTO_REPOSICION = 0;
          el.VALOR_TOTAL = 0;
          el.CALCULADO_FROM_PROMEDIO_CONSUMO = false;

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
            const salPrev = salidasPrevias.filter(
              sp => sp.COD_AGRUPAMIENTO === rs.COD_AGRUPAMIENTO
            );
            rs.PROMEDIO_CONSUMO = salPrev.length ? salPrev[0].SALIDA / mesesPosteriores.length : 0;
            rs.CALCULADO_FROM_PROMEDIO_CONSUMO = salPrev.length ? true : false;
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
      } catch (error: any) {
        throw new BadRequestException(error.message);
      } finally {
        if (qr && closeQr) await qr.release();
      }
    }

    return results;
  } catch (error: any) {
    throw new Error(error.message);
  } finally {
  }
};
