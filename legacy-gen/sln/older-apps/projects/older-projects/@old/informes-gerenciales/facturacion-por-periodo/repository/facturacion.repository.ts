import { IPgpmap, ResumenFacturacion } from '../class';
import {
  Deficit,
  DeficitPGP,
  Cumplimiento,
  FacturadoPGP,
  FacturadoPeriodo,
  FacturadoSubtotal,
} from '../helpers';
import { proyectPorMesQuery, porMesQuery } from './facturacion-por-mes.query';
import { IFecha, IFechaFormateada } from '../interfaces/facturacion-por-mes.interfaces';
import { BaseSource } from '@sln/old/common/infrastructure/bases';
import { GcmContexts } from '@common/application/constants';

/** @deprecated Use the v2 */
export class FacturacionRepository extends BaseSource {
  async getFacturacionPorMes(fechas: IFecha[], centro1: number, centro2: number) {
    const fechasFormateadas: IFechaFormateada[] = [];

    fechas.map((r: IFecha) => {
      const ultimoDia = new Date(Number(r.anio), Number(r.mes) - 1 + 1, 0);
      return fechasFormateadas.push({
        inicio: `${r.anio}-${r.mes}-01`,
        fin: `${r.anio}-${r.mes}-${ultimoDia.getDate()}`,
      });
    });

    const resultados: any = [];

    for (let i = 0; i < fechasFormateadas.length; i++) {
      const estadisticas = await this.conn.query(porMesQuery, [
        fechasFormateadas[i].inicio,
        fechasFormateadas[i].fin,
      ]);

      resultados.push({
        mes: `${fechas[i].mes}-${fechas[i].anio}`,
        registroPGP: estadisticas[0].registroPGP,
        registroAnuladoPosteriorPGP: estadisticas[0].registroAnuladoPosteriorPGP,
        facturadoPGP: estadisticas[0].facturadoPGP,
        facturadoEventos: estadisticas[0].facturadoTotal - estadisticas[0].facturadoPGP,
        totalFacturado: estadisticas[0].facturadoTotal,
        totalAnuladoPosterior: estadisticas[0].totalAnuladoPosterior,
        refacturado: estadisticas[0].refacturado,
      });
    }

    return resultados;
  }

  async getFacturacionResumen(
    fechaInicio: string,
    fechaFin: string,
    centro1: number,
    centro2: number
  ) {
    if (this.auth.context === GcmContexts.ALTACENTRO) {
      const resumen = await this.conn.query(
        `
        SELECT 
          COUNT(*) DOCUMENTOS,
          COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
          COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
  
          (SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      -ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
      ) FACTURADOEVENTO,
          SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END) REGISTROPGP,
          (
          SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
          + SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
          -ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          ) PRODUCCION,
          ISNULL(SUM(CASE WHEN CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN NULL ELSE  SFAVALREC END), 0) FACTRECUPERACION,
          ISNULL(SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0) TOTALFACTURASANULADAS,
  
  
          (
          SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END)
          - ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          + ISNULL(SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          ) FACTURADOSUBTOTAL,
  
          ISNULL(SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END), 0) TOTALREFACTURADA,
          (
          SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
          - ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          + ISNULL(SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          - ISNULL(SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END), 0)
          ) FACTURADOPERIODO,
  
  
          ISNULL(SUM(CASE WHEN (SFATIPDOC = 16 OR C.GDECODIGO IN('8014', '8016')) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0) FACTURADOPGP,
          (
      SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
          - ISNULL(SUM(CASE WHEN (SFATIPDOC = 16 OR C.GDECODIGO IN('8014', '8016')) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
      ) DEFICITPGP
  
          FROM GCVUSUFACTUR
          INNER JOIN GENDETCON C ON C.OID = GCVUSUFACTUR.GENDETCON
          WHERE
          CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
          AND SFACANANU < 1
          AND ADNCENATE IN(@2, @3)
  
        `,
        [fechaInicio, fechaFin, centro1, centro2]
      );

      const meta = await this.conn.query(proyectPorMesQuery, [
        fechaInicio,
        fechaFin,
        centro1,
        centro2,
      ]);

      const resumenConstant = await this.conn.query(
        `
        SELECT 
          COUNT(*) DOCUMENTOS,
          COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
          COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
  
          (SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      -ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
      ) FACTURADOEVENTO,
          SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END) REGISTROPGP,
          (
          SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
          + SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
          -ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          ) PRODUCCION,
          ISNULL(SUM(CASE WHEN CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN NULL ELSE  SFAVALREC END), 0) FACTRECUPERACION,
          ISNULL(SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0) TOTALFACTURASANULADAS,
  
  
          (
          SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END)
          - ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          + ISNULL(SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          ) FACTURADOSUBTOTAL,
  
          ISNULL(SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END), 0) TOTALREFACTURADA,
          (
          SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
          - ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          + ISNULL(SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          - ISNULL(SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END), 0)
          ) FACTURADOPERIODO,
  
  
          ISNULL(SUM(CASE WHEN (SFATIPDOC = 16 OR C.GDECODIGO IN('8014', '8016')) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0) FACTURADOPGP,
          (
            ISNULL(SUM(CASE WHEN (SFATIPDOC = 16 OR C.GDECODIGO IN('8014', '8016')) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
            -SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
          ) DEFICITPGP
  
          FROM GCVUSUFACTUR
          INNER JOIN GENDETCON C ON C.OID = GCVUSUFACTUR.GENDETCON
          WHERE
          CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
          AND SFACANANU < 1`,
        [fechaInicio, fechaFin]
      );

      const egresos = await this.conn.query(
        `SELECT 
        COUNT(*) CANTIDAD,
        ISNULL(SUM(C.VALOR), 0) VALOR
        FROM 
        ADNEGRESO E
        RIGHT JOIN(
        SELECT 
        dbo.ADNEGRESO.OID AS ADNEGRESO,
        SUM(dbo.SLNSERPRO.SERVALPRO * dbo.SLNSERPRO.SERCANTID) AS VALOR
        FROM     
        dbo.SLNSERPRO INNER JOIN
        dbo.ADNINGRESO ON dbo.ADNINGRESO.OID = dbo.SLNSERPRO.ADNINGRES1 INNER JOIN
        dbo.ADNEGRESO ON dbo.ADNEGRESO.ADNINGRESO = dbo.ADNINGRESO.OID INNER JOIN
        dbo.SLNORDSER ON dbo.SLNORDSER.OID = dbo.SLNSERPRO.SLNORDSER1 AND dbo.SLNORDSER.SOSESTADO <> 2
        WHERE CONVERT(DATE, dbo.ADNEGRESO.ADEFECSAL, 103) BETWEEN @0 AND @1 
        AND AINESTADO != 1
	    	AND ADNCENATE IN(@2, @3)
        GROUP BY 
        dbo.ADNEGRESO.OID
		) C ON C.ADNEGRESO = E.OID`,
        [fechaInicio, fechaFin, centro1, centro2]
      );

      return { resumen, resumenConstant, meta, egresos };
    } else {
      const meta = await this.conn.query(proyectPorMesQuery, [
        fechaInicio,
        fechaFin,
        centro1,
        centro2,
      ]);
      const resumen = await this.conn.query(
        `
        SELECT 
          COUNT(*) DOCUMENTOS,
          COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
          COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
  
          (SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      -ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
      ) FACTURADOEVENTO,
          ISNULL(SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0) REGISTROPGP,
          (
          ISNULL(SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          + SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
          -ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          ) PRODUCCION,
          ISNULL(SUM(CASE WHEN CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN NULL ELSE  SFAVALREC END), 0) FACTRECUPERACION,
          ISNULL(SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0) TOTALFACTURASANULADAS,
  
  
          (
          SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END)
          - ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          + ISNULL(SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          ) FACTURADOSUBTOTAL,
  
          ISNULL(SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END), 0) TOTALREFACTURADA,
          (
          SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
          - ISNULL(SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END), 0)
          + ISNULL(SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          - ISNULL(SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END), 0)
          ) FACTURADOPERIODO,
  
  
          ISNULL(SUM(CASE WHEN (SFATIPDOC = 16 OR C.GDECODIGO IN('8014', '8016') OR SFATOTFAC > 700000000) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0) FACTURADOPGP,
          (
            ISNULL(SUM(CASE WHEN (SFATIPDOC = 16 OR C.GDECODIGO IN('8014', '8016')) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
            - ISNULL(SUM(CASE WHEN SFATIPDOC = 17 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END), 0)
          ) DEFICITPGP
  
          FROM GCVUSUFACTUR
          INNER JOIN GENDETCON C ON C.OID = GCVUSUFACTUR.GENDETCON
          WHERE
          CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
          AND SFACANANU < 1`,
        [fechaInicio, fechaFin]
      );
      const egresos = await this.conn.query(
        `SELECT 
        COUNT(*) CANTIDAD,
        SUM(C.VALOR) VALOR
        FROM 
        ADNEGRESO E
        RIGHT JOIN(
        SELECT 
        dbo.ADNEGRESO.OID AS ADNEGRESO,
        SUM(dbo.SLNSERPRO.SERVALPRO * dbo.SLNSERPRO.SERCANTID) AS VALOR
        FROM     
        dbo.SLNSERPRO INNER JOIN
        dbo.ADNINGRESO ON dbo.ADNINGRESO.OID = dbo.SLNSERPRO.ADNINGRES1 INNER JOIN
        dbo.ADNEGRESO ON dbo.ADNEGRESO.ADNINGRESO = dbo.ADNINGRESO.OID INNER JOIN
        dbo.SLNORDSER ON dbo.SLNORDSER.OID = dbo.SLNSERPRO.SLNORDSER1 AND dbo.SLNORDSER.SOSESTADO <> 2
        WHERE CONVERT(DATE, dbo.ADNEGRESO.ADEFECSAL, 103) BETWEEN @0 AND @1 
        AND AINESTADO != 1
        GROUP BY 
        dbo.ADNEGRESO.OID
        ) C ON C.ADNEGRESO = E.OID`,
        [fechaInicio, fechaFin]
      );
      return { resumen, meta, egresos };
    }
  }

  async ResumenConsolidado(
    fechaInicio: string,
    fechaFin: string,
    centro1: number,
    centro2: number
  ) {
    const data = new ResumenFacturacion();
    const res = await this.getFacturacionResumen(fechaInicio, fechaFin, centro1, centro2);
    if (this.auth.context === GcmContexts.ALTACENTRO) {
      const resumen = res.resumen[0];
      const resumenConstant = res.resumenConstant[0];
      const meta = res.meta[0];
      const egreso = res.egresos[0];
      if (centro1 === 1 && centro2 === 2) {
        const CUMPLIMIENTO = Cumplimiento(meta, resumenConstant.FACTURADOPERIODO);
        const DEFICIT = Deficit(meta, resumenConstant.FACTURADOPERIODO);

        data.METAPERIODO = meta.META;
        data.DOCUMENTOS = resumenConstant.DOCUMENTOS;
        data.CANTIDADREFACTURADA = resumenConstant.CANTIDADREFACTURADA;
        data.FACTURASANULADAS = resumenConstant.FACTURASANULADAS;
        data.FACTURADOEVENTO = resumenConstant.FACTURADOEVENTO;
        data.REGISTROPGP = resumenConstant.REGISTROPGP;
        data.PRODUCCION = resumenConstant.PRODUCCION;
        data.FACTRECUPERACION = resumenConstant.FACTRECUPERACION;
        data.TOTALFACTURASANULADAS = resumenConstant.TOTALFACTURASANULADAS;
        data.FACTURADOSUBTOTAL = resumenConstant.FACTURADOSUBTOTAL;
        data.TOTALREFACTURADA = resumenConstant.TOTALREFACTURADA;
        data.FACTURADOPERIODO = resumenConstant.FACTURADOPERIODO;
        data.FACTURADOPGP = resumenConstant.FACTURADOPGP;
        data.DEFICITPGP = resumenConstant.DEFICITPGP;
        data.PROYECCION = resumenConstant.PRODUCCION;
        data.CUMPLIMIENTO = CUMPLIMIENTO;
        data.DEFICIT = DEFICIT;
        data.CANTEGRESO = egreso.CANTIDAD;
        data.VALEGRESO = egreso.VALOR;
      } else {
        const FACTURADOPGP = FacturadoPGP(resumen, resumenConstant);
        const FACTURADOSUBTOTAL = FacturadoSubtotal(resumen, FACTURADOPGP);
        const FACTURADOPERIODO = FacturadoPeriodo(FACTURADOSUBTOTAL, resumen);
        const DEFICIT = Deficit(meta, FACTURADOPERIODO);
        const CUMPLIMIENTO = Cumplimiento(meta, FACTURADOPERIODO);
        const DEFICITPGP = DeficitPGP(FACTURADOPGP, resumen);

        data.METAPERIODO = meta.META;
        data.DOCUMENTOS = resumen.DOCUMENTOS;
        data.CANTIDADREFACTURADA = resumen.CANTIDADREFACTURADA;
        data.FACTURASANULADAS = resumen.FACTURASANULADAS;
        data.FACTURADOEVENTO = resumen.FACTURADOEVENTO;
        data.REGISTROPGP = resumen.REGISTROPGP;
        data.PRODUCCION = resumen.PRODUCCION;
        data.FACTRECUPERACION = resumen.FACTRECUPERACION;
        data.TOTALFACTURASANULADAS = resumen.TOTALFACTURASANULADAS;
        data.FACTURADOSUBTOTAL = FACTURADOSUBTOTAL;
        data.TOTALREFACTURADA = resumen.TOTALREFACTURADA;
        data.FACTURADOPERIODO = FACTURADOPERIODO;
        data.FACTURADOPGP = FACTURADOPGP;
        data.DEFICITPGP = DEFICITPGP;
        data.PROYECCION = resumen.PRODUCCION;
        data.CUMPLIMIENTO = CUMPLIMIENTO;
        data.DEFICIT = DEFICIT;
        data.CANTEGRESO = egreso.CANTIDAD;
        data.VALEGRESO = egreso.VALOR;
      }
      return data;
    } else {
      const resumen = res.resumen[0];
      const meta = res.meta[0];
      const egreso = res.egresos[0];
      //const FACTURADOPGP = FacturadoPGP(resumen, resumenConstant);
      const FACTURADOSUBTOTAL = FacturadoSubtotal(resumen, 0);
      const FACTURADOPERIODO = FacturadoPeriodo(FACTURADOSUBTOTAL, resumen);
      const DEFICIT = Deficit(meta, FACTURADOPERIODO);
      const CUMPLIMIENTO = Cumplimiento(meta, FACTURADOPERIODO);
      //const DEFICITPGP = DeficitPGP(FACTURADOPGP, resumen);

      data.METAPERIODO = meta.META;
      data.DOCUMENTOS = resumen.DOCUMENTOS;
      data.CANTIDADREFACTURADA = resumen.CANTIDADREFACTURADA;
      data.FACTURASANULADAS = resumen.FACTURASANULADAS;
      data.FACTURADOEVENTO = resumen.FACTURADOEVENTO;
      data.REGISTROPGP = resumen.REGISTROPGP;
      data.PRODUCCION = resumen.PRODUCCION;
      data.FACTRECUPERACION = resumen.FACTRECUPERACION;
      data.TOTALFACTURASANULADAS = resumen.TOTALFACTURASANULADAS;
      data.FACTURADOSUBTOTAL = FACTURADOSUBTOTAL;
      data.TOTALREFACTURADA = resumen.TOTALREFACTURADA;
      data.FACTURADOPERIODO = FACTURADOPERIODO;
      data.FACTURADOPGP = resumen.FACTURADOPGP;
      data.DEFICITPGP = resumen.DEFICITPGP;
      data.PROYECCION = resumen.PRODUCCION;
      data.CUMPLIMIENTO = CUMPLIMIENTO;
      data.DEFICIT = DEFICIT;
      data.CANTEGRESO = egreso.CANTIDAD;
      data.VALEGRESO = egreso.VALOR;
      return data;
    }
  }

  async getFacturaciongraficas(
    fechaInicio: string,
    fechaFin: string,
    centro1: number,
    centro2: number
  ) {
    const meta = await this.conn.query(
      `
            SELECT 
      SUM(CASE MONTH(@0)
      WHEN 1 THEN CENPROENE
      WHEN 2 THEN CENPROFEB
      WHEN 3 THEN CENPROMAR
      WHEN 4 THEN CENPROABR
      WHEN 5 THEN CENPROMAY
      WHEN 6 THEN CENPROJUN
      WHEN 7 THEN CENPROJUL
      WHEN 8 THEN CENPROAGO
      WHEN 9 THEN CENPROSEP
      WHEN 10 THEN CENPROOCT
      WHEN 11 THEN CENPRONOV
      WHEN 12 THEN CENPRODIC
      ELSE
      0
      END) META
      FROM
      GCMCENATEPRO
      WHERE 
      PERIODO = YEAR(@0)
      AND ADNCENATE IN(@2, @3)
      `,
      [fechaInicio, fechaFin, centro1, centro2]
    );
    const diario = await this.conn.query(
      `SELECT 
      G.DayNumberOfMonth DIA,
      ISNULL(CONS.PRODUCCION, 0) PRODUCCION
      FROM 
      GCMDIMFECHA G LEFT JOIN(
      SELECT 
      DAY(SFAFECFAC) DIA,
      ISNULL(
      --SUM(CASE WHEN SFATIPDOC = 17  THEN SFATOTFAC ELSE NULL END)+ 
      SUM(CASE WHEN SFATIPDOC IN(0, 1, 17) THEN SFATOTFAC ELSE NULL END) 
      - SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END)
      , SUM(CASE WHEN SFATIPDOC IN(0, 1, 17) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
      ) PRODUCCION
      FROM GCVUSUFACTUR
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      AND ADNCENATE IN(@2, @3)
      GROUP BY DAY(SFAFECFAC)
      )CONS ON CONS.DIA = G.DayNumberOfMonth
      WHERE CONVERT(DATE, G.Date, 103) Between @0 AND @1;`,
      [fechaInicio, fechaFin, centro1, centro2]
    );
    const egreso = await this.conn.query(
      `SELECT 
            G.DayNumberOfMonth DIA,
            CONS.FACTURAS FACTURADAS,
          EGRE.FACTURAS PENDIENTES
            FROM GCMDIMFECHA G
            LEFT JOIN 
            (SELECT 
            DAY(SFAFECFAC) DIA,
            COUNT(*) FACTURAS
            FROM GCVUSUFACTUR
            WHERE 
            CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
            AND SFACANANU < 1
            AND ADNCENATE IN(@2, @3)
          AND SFADOCANU = 0
            GROUP BY DAY(SFAFECFAC)
            )CONS ON CONS.DIA = G.DayNumberOfMonth
          LEFT JOIN 
          (
          SELECT 
          DAY(AEGFECEGR)DIA,
           COUNT(*) FACTURAS
          FROM GCVEGRFACTUR
          WHERE CONVERT(DATE, AEGFECEGR, 103) BETWEEN @0 AND @1 
          AND AINESTADO != 1
          AND ADNCENATE IN(@2, @3)
          GROUP BY DAY(AEGFECEGR)
          )EGRE ON G.DayNumberOfMonth = EGRE.DIA
            WHERE CONVERT(DATE, G.Date, 103) BETWEEN @0 AND @1
      `,
      [fechaInicio, fechaFin, centro1, centro2]
    );
    return { meta, diario, egreso };
  }

  async GraficasConsolidado(
    fechaInicio: string,
    fechaFin: string,
    centro1: number,
    centro2: number
  ) {
    const res = await this.getFacturaciongraficas(fechaInicio, fechaFin, centro1, centro2);
    const facturacionAcumulada: any[] = [];
    let i = 0;
    let produccionAcumulada = 0;
    let proyeccionAcumulada = 0;
    const año = Number(fechaInicio.split('-')[0]);
    const mes = Number(fechaInicio.split('-')[1]);
    const date = new Date(año, mes, 0).getDate();
    const meta = res.meta[0];
    const diario = res.diario;
    const egreso = res.egreso;
    const facturacionDiaria = diario.map((item: any, index: any) => {
      return {
        DIA: item.DIA,
        PRODUCCION: item.PRODUCCION,
        PROYECCION: meta.META / date,
      };
    });
    while (i < facturacionDiaria.length) {
      produccionAcumulada += facturacionDiaria[i].PRODUCCION;
      proyeccionAcumulada = proyeccionAcumulada + facturacionDiaria[i].PROYECCION;
      facturacionAcumulada.push({
        DIA: facturacionDiaria[i].DIA,
        PRODUCCION: produccionAcumulada,
        PROYECCION: proyeccionAcumulada,
      });
      i++;
    }
    const EgresosFacturados = egreso.map((item, index) => {
      return {
        DIA: item.DIA,
        FACTURAS: item.FACTURADAS,
        PENDIENTES: item.PENDIENTES,
      };
    });
    return { facturacionAcumulada, facturacionDiaria, EgresosFacturados };
  }

  centros = async (fechainicio: string, fechaFin: string) => {
    return await this.conn.query(
      `SELECT 
      ISNULL(ACANOMBRE, 'FACTURA GLOBAL PGP') NOMBRE,
      COUNT(*) DOCUMENTOS,
      COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
      COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
      
      SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
      SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
      ISNULL(
      SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      - SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) 
      BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END),
      SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
      ) FACTURADO,
      SUM(SFATOTFAC) PRODUCCION
      FROM GCVUSUFACTUR
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      GROUP BY ACANOMBRE
      ORDER BY ACANOMBRE 
      `,
      [fechainicio, fechaFin]
    );
  };

  documentos = async (fechainicio: string, fechaFin: string) => {
    return await this.conn.query(
      `SELECT 
    Case When SFATIPDOC = 0 Then 'FACTURA PACIENTE'
        When SFATIPDOC = 1 Then 'FACTURA ENTIDAD'
      When SFATIPDOC = 16 Then 'FACTURA GLOBALPFGP'
        Else 'REGISTRO FACTURA GLOBAL PFGP' End As NOMBRE,
    COUNT(*) DOCUMENTOS,
    COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
    COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
    
    SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
    SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
    ISNULL(
    SUM(CASE WHEN SFATIPDOC IN(0, 1, 17)THEN SFATOTFAC ELSE NULL END) 
    - SUM(CASE WHEN SFATIPDOC IN(0, 1, 17) AND CONVERT(DATE, SFAFECANU, 103) 
    BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END),
    SUM(CASE WHEN SFATIPDOC = 16 AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
    ) FACTURADO,
    SUM(SFATOTFAC) PRODUCCION
    FROM GCVUSUFACTUR
    WHERE
    CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
    AND SFACANANU < 1
    GROUP BY SFATIPDOC`,
      [fechainicio, fechaFin]
    );
  };

  servicioEgreso = async (fechainicio: string, fechaFin: string) => {
    return await this.conn.query(
      `SELECT 
      ISNULL(AESNOMBRE, 'INGRESO POR CONSULTA EXTERNA') NOMBRE,
      COUNT(*) DOCUMENTOS,
      COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
      COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
      
      SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
      SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
      ISNULL(
      SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      - SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) 
      BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END),
      SUM(CASE WHEN SFATIPDOC IN(0, 1) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
      ) FACTURADO,
      SUM(SFATOTFAC) PRODUCCION
      FROM GCVUSUFACTUR
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      GROUP BY AESNOMBRE
      `,
      [fechainicio, fechaFin]
    );
  };

  entidades = async (fechainicio: string, fechaFin: string) => {
    return await this.conn.query(
      `SELECT 
      GENTERCER,
      GTRNOMBRE NOMBRE,
      COUNT(*) DOCUMENTOS,
      COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
      COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
      
      SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
      SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
      ISNULL(
      SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      - SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) 
      BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END),
      SUM(CASE WHEN SFATIPDOC IN(0, 1) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
      ) FACTURADO,
      SUM(SFATOTFAC) PRODUCCION
      FROM GCVUSUFACTUR
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      GROUP BY GENTERCER, GTRNOMBRE`,
      [fechainicio, fechaFin]
    );
  };

  contratosPorEntidades = async (fechainicio: string, fechaFin: string, entidad: string) => {
    return await this.conn.query(
      `SELECT 
      GDENOMBRE NOMBRE,
      COUNT(*) DOCUMENTOS,
      COUNT(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
      COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
      
      SUM(CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
      SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
      ISNULL(
      SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
      - SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) 
      BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END),
      SUM(CASE WHEN SFATIPDOC IN(0, 1, 16) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
      ) FACTURADO,
      SUM(SFATOTFAC) PRODUCCION
      FROM GCVUSUFACTUR
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      AND GENTERCER = @2
      GROUP BY GDENOMBRE`,
      [fechainicio, fechaFin, entidad]
    );
  };

  usuarios = async (fechainicio: string, fechaFin: string) => {
    return await this.conn.query(
      `SELECT 
      SFAGENUSU,
      USUDESCRI,
      COUNT(*) DOCUMENTOS,
      COUNT(CASE WHEN CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
      COUNT(CASE WHEN  CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN NULL ELSE SLNFACTUR END) FACTURASREAL,
      COUNT(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
      
      SUM(CASE WHEN CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN G.SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
      SUM(CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
      ISNULL(
      SUM(CASE WHEN SFATIPDOC IN(0, 1)THEN G.SFATOTFAC ELSE NULL END) 
      - SUM(CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) 
      BETWEEN @0 AND @1 THEN G.SFATOTFAC ELSE NULL END),
      SUM(CASE WHEN SFATIPDOC IN(0,1, 16) AND SFADOCANU = 0 THEN G.SFATOTFAC ELSE NULL END)
      ) FACTURADO,
      SUM(G.SFATOTFAC) PRODUCCION
      FROM GCVUSUFACTUR G
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      GROUP BY SFAGENUSU, USUDESCRI`,
      [fechainicio, fechaFin]
    );
  };

  usuariosConsolidado = async (fechainicio: string, fechaFin: string) => {
    const usuarios = await this.usuarios(fechainicio, fechaFin);
    const cantidad = usuarios.length;
    const UsuariosConsolidado = usuarios.map(usuario => {
      return {
        CODUSUARIO: usuario.SFAGENUSU,
        NOMBRE: usuario.USUDESCRI,
        DOCUMENTOS: usuario.DOCUMENTOS,
        FACTURASANULADAS: usuario.FACTURASANULADAS,
        CANTIDADREFACTURADA: usuario.CANTIDADREFACTURADA,
        TOTALFACTURASANULADAS: usuario.TOTALFACTURASANULADAS,
        TOTALREFACTURADA: usuario.TOTALREFACTURADA,
        FACTURADO: usuario.FACTURADO,
        PRODUCCION: usuario.PRODUCCION,
        PROMEDIODOC: usuario.DOCUMENTOS / cantidad,
        PROMEDIOFACT: usuario.PRODUCCION / cantidad,
        PROMEDIOFACTSUB: usuario.FACTURADO / cantidad,
        PROMEDIOREFACT: usuario.TOTALREFACTURADA / cantidad,
      };
    });
    return UsuariosConsolidado;
  };

  //*Nueva configuracion de facturacion por centro de atencion
  pgp = async (inicio: string, final: string): Promise<IPgpmap[]> => {
    return await this.conn.query(
      `SELECT 
      SFATIPDOC,
      SFADOCANU,
      GENDETCON,
      GDECODIGO,
      ISNULL(ADNCENATE, 0)ADNCENATE,
      ACANOMBRE,
      CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN 1 ELSE 0 END FACTURASANULADAS,
      CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN 1 ELSE 0 END CANTIDADREFACTURADA,
      CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE 0 END TOTALFACTURASANULADAS,
      CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE 0 END TOTALREFACTURADA,
      (CASE WHEN SFATIPDOC IN(0, 1, 16)THEN SFATOTFAC ELSE 0 END) -
      (CASE WHEN SFATIPDOC IN(0, 1, 16) AND CONVERT(DATE, SFAFECANU, 103) 
      BETWEEN  @0 AND @1 THEN SFATOTFAC ELSE 0 END)FACTURADO,
      SFATOTFAC PRODUCCION
      FROM GCVUSUFACTUR
      INNER JOIN GENDETCON ON GENDETCON.OID = GCVUSUFACTUR.GENDETCON 
      WHERE
      CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
      AND SFACANANU < 1
      `,
      [inicio, final]
    );
  };

  centros2 = async (inicio: string, final: string) => {
    //!Pgp
    const Pgp = [];
    let NOMBREPGP;
    let DOCUMENTOSpgp = 0;
    let FACTURADOpgp = 0;
    let FACTURASANULADASpgp = 0;
    let TOTALFACTURASANULADASpgp = 0;
    let PRODUCCIONpgp = 0;
    let CANTIDADREFACTURADApgp = 0;
    let TOTALREFACTURADApgp = 0;
    //!Centro1
    const centro1 = [];
    let NOMBRECentro1;
    let DOCUMENTOSCentro1 = 0;
    let FACTURADOCentro1 = 0;
    let FACTURASANULADASCentro1 = 0;
    let TOTALFACTURASANULADASCentro1 = 0;
    let PRODUCCIONCentro1 = 0;
    let CANTIDADREFACTURADACentro1 = 0;
    let TOTALREFACTURADACentro1 = 0;
    //!Centro2 :: En el caso de ser alta complejidad
    const centro2 = [];
    let NOMBRECentro2;
    let DOCUMENTOSCentro2 = 0;
    let FACTURADOCentro2 = 0;
    let FACTURASANULADASCentro2 = 0;
    let TOTALFACTURASANULADASCentro2 = 0;
    let PRODUCCIONCentro2 = 0;
    let CANTIDADREFACTURADACentro2 = 0;
    let TOTALREFACTURADACentro2 = 0;
    try {
      const facturas = await this.pgp(inicio, final);
      facturas.map(f => {
        if (
          f.GDECODIGO === '8014' ||
          f.GDECODIGO === '8016' ||
          f.ADNCENATE === 0 ||
          (f.GDECODIGO === 'I202' && f.SFATIPDOC === 16) ||
          f.FACTURADO > 700000000
        ) {
          NOMBREPGP = 'FACTURA GLOBAL PGP';
          DOCUMENTOSpgp += 1;
          PRODUCCIONpgp += f.PRODUCCION;
          CANTIDADREFACTURADApgp += f.CANTIDADREFACTURADA;
          TOTALREFACTURADApgp += f.TOTALREFACTURADA;
          if (f.SFADOCANU) {
            FACTURASANULADASpgp += 1;
            TOTALFACTURASANULADASpgp += f.TOTALFACTURASANULADAS;
          }
          FACTURADOpgp += f.FACTURADO;
        } else {
          if (
            f.ADNCENATE === 1 ||
            (f.ADNCENATE === 5 && f.GDECODIGO !== '8014' && f.GDECODIGO !== '8016')
          ) {
            NOMBRECentro1 = f.ACANOMBRE;
            DOCUMENTOSCentro1 += 1;
            PRODUCCIONCentro1 += f.PRODUCCION;
            CANTIDADREFACTURADACentro1 += f.CANTIDADREFACTURADA;
            TOTALREFACTURADACentro1 += f.TOTALREFACTURADA;
            if (f.SFADOCANU) {
              FACTURASANULADASCentro1 += 1;
              TOTALFACTURASANULADASCentro1 += f.TOTALFACTURASANULADAS;
            }
            FACTURADOCentro1 += f.FACTURADO;
          } else {
            NOMBRECentro2 = f.ACANOMBRE;
            DOCUMENTOSCentro2 += 1;
            PRODUCCIONCentro2 += f.PRODUCCION;
            CANTIDADREFACTURADACentro2 += f.CANTIDADREFACTURADA;
            TOTALREFACTURADACentro2 += f.TOTALREFACTURADA;
            if (f.SFADOCANU) {
              FACTURASANULADASCentro2 += 1;
              TOTALFACTURASANULADASCentro2 += f.TOTALFACTURASANULADAS;
            }
            FACTURADOCentro2 += f.FACTURADO;
          }
        }
      });
      if (FACTURADOpgp > 0) {
        Pgp.push({
          NOMBRE: NOMBREPGP,
          DOCUMENTOS: DOCUMENTOSpgp,
          FACTURASANULADAS: FACTURASANULADASpgp,
          PRODUCCION: PRODUCCIONpgp,
          TOTALFACTURASANULADAS: TOTALFACTURASANULADASpgp,
          FACTURADO: FACTURADOpgp,
          CANTIDADREFACTURADA: CANTIDADREFACTURADApgp,
          TOTALREFACTURADA: TOTALREFACTURADApgp,
        });
      }
      if (NOMBRECentro1) {
        centro1.push({
          NOMBRE: NOMBRECentro1,
          DOCUMENTOS: DOCUMENTOSCentro1,
          FACTURASANULADAS: FACTURASANULADASCentro1,
          PRODUCCION: PRODUCCIONCentro1,
          TOTALFACTURASANULADAS: TOTALFACTURASANULADASCentro1,
          FACTURADO: FACTURADOCentro1,
          CANTIDADREFACTURADA: CANTIDADREFACTURADACentro1,
          TOTALREFACTURADA: TOTALREFACTURADACentro1,
        });
      }
      if (NOMBRECentro2) {
        centro2.push({
          NOMBRE: NOMBRECentro2,
          DOCUMENTOS: DOCUMENTOSCentro2,
          FACTURASANULADAS: FACTURASANULADASCentro2,
          PRODUCCION: PRODUCCIONCentro2,
          TOTALFACTURASANULADAS: TOTALFACTURASANULADASCentro2,
          FACTURADO: FACTURADOCentro2,
          CANTIDADREFACTURADA: CANTIDADREFACTURADACentro2,
          TOTALREFACTURADA: TOTALREFACTURADACentro2,
        });
      }
      const centros = [Pgp[0], centro1[0], centro2[0]];
      for (let i = 0; i < centros.length; i++) {
        if (centros[i] === undefined) centros.splice(i, 1);
      }
      return centros;
    } catch (error) {
      return [];
    }
  };

  //*Nueva configuracion por documentos
  documentos2 = async (inicio: string, final: string) => {
    return await this.conn.query(
      `
    SELECT NOMBRE,
	COUNT(*)DOCUMENTOS,
	COUNT(FACTURASANULADAS)FACTURASANULADAS,
	COUNT(CANTIDADREFACTURADA)CANTIDADREFACTURADA,
	ISNULL(SUM(TOTALFACTURASANULADAS), 0)TOTALFACTURASANULADAS,
	ISNULL(SUM(TOTALREFACTURADA), 0) TOTALREFACTURADA,
	ISNULL(SUM(FACTURADO), 0)FACTURADO,
	ISNULL(SUM(PRODUCCION), 0)PRODUCCION
FROM GCVUSUFACTUR
INNER JOIN 
	  (SELECT 
	  SLNFACTUR,
    Case When SFATIPDOC = 0 Then 'FACTURA PACIENTE'
        When SFATIPDOC = 1 AND GDECODIGO != '8014' AND GDECODIGO != '8016' Then 'FACTURA ENTIDAD'
      When SFATIPDOC = 16 OR GDECODIGO = '8014'OR GDECODIGO = '8016' Then 'FACTURA GLOBALPFGP'
        Else 'REGISTRO FACTURA GLOBAL PFGP' End As NOMBRE,
    (CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SLNFACTUR ELSE NULL END) FACTURASANULADAS,
    (CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SLNFACTUR ELSE NULL END) CANTIDADREFACTURADA,
    
    (CASE WHEN SFADOCANU = 1 AND CONVERT(DATE, SFAFECANU, 103) BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END) TOTALFACTURASANULADAS,
    (CASE WHEN CONVERT(DATE, SRFFECFAC, 103) < @0 THEN SRFTOTFAC ELSE NULL END) TOTALREFACTURADA,
    ISNULL(
    (CASE WHEN SFATIPDOC IN(0, 1)THEN SFATOTFAC ELSE NULL END) 
    - (CASE WHEN SFATIPDOC IN(0, 1) AND CONVERT(DATE, SFAFECANU, 103) 
    BETWEEN @0 AND @1 THEN SFATOTFAC ELSE NULL END),
    (CASE WHEN SFATIPDOC IN(0, 1, 16, 17) AND SFADOCANU = 0 THEN SFATOTFAC ELSE NULL END)
    ) FACTURADO,
    (SFATOTFAC) PRODUCCION
    FROM GCVUSUFACTUR
	INNER JOIN GENDETCON ON GENDETCON.OID = GCVUSUFACTUR.GENDETCON 
    WHERE
    CONVERT(DATE, SFAFECFAC, 103) BETWEEN @0 AND @1
    AND SFACANANU < 1
    ) AS CON ON CON.SLNFACTUR = GCVUSUFACTUR.SLNFACTUR WHERE SFACANANU < 1
	GROUP BY CON.NOMBRE`,
      [inicio, final]
    );
  };
}
