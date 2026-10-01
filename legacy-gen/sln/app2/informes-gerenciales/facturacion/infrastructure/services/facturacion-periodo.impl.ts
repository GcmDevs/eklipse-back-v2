import { Injectable } from '@nestjs/common';
import { GCM_CONTEXTS } from '@common/domain/types';
import { getDateRange } from '@common/application/services';
import { BaseSource } from '@common/infrastructure/services';
import {
  FacturacionPeriodoModel,
  FacturaModel,
  ResumenPeriodoEntidadesModel,
  ResumenPeriodoModel,
} from '@sln/informes-gerenciales/facturacion/domain/models';
import {
  getFacturasPendientesQuery,
  getFacturasPorPeriodoQuery,
  getResumenPeriodoQuery,
  getResumenPeriodoPorEntidadQuery,
  getMetaFacturacionQuery,
  getIngresosSinFacturar,
} from '../queries/facturacion-periodo';

@Injectable()
export class FacturacionPeriodoImpl extends BaseSource {
  public async getFacturacionPeriodo(inicio: Date, final: Date): Promise<FacturacionPeriodoModel> {
    const inicioFt = inicio.toISOString().split('T')[0];
    const finalFt = final.toISOString().split('T')[0];

    const metasPorMes: { centro: number; meta: number }[] = [];
    const centros: { id: number }[] = await this.conn.query(`SELECT OID id FROM ADNCENATE`);

    for (let i = 0; i < centros.length; i++) {
      const result = await this.conn.query(getMetaFacturacionQuery(inicio, [centros[i].id]));
      metasPorMes.push({ centro: centros[i].id, meta: result[0].META });
    }

    const facturas: FacturaModel[] = await this.conn.query(getFacturasPorPeriodoQuery(), [
      inicioFt,
      finalFt,
    ]);

    facturas.map(f => {
      if (f.fechaEgreso >= inicio && f.fechaFacturacion >= inicio) {
        f.isProducidoActual = true;
      } else {
        f.isProducidoActual = false;
      }
    });

    const facturasPendientes: any[] = await this.conn.query(getFacturasPendientesQuery(false), [
      inicioFt,
      finalFt,
    ]);

    const facturasPendientesAnteriores = await this.conn.query(getFacturasPendientesQuery(true), [
      inicioFt,
      finalFt,
    ]);

    const ingresosSinFacturar = await this.conn.query(getIngresosSinFacturar(false), [
      inicioFt,
      finalFt,
    ]);

    return {
      metasPorMes,
      facturasPendientes,
      facturasPendientesAnteriores,
      facturas: facturas.filter(r => [4].indexOf(r.tipoDocumento) < 0),
      ingresosSinFacturar,
      ingresosAnteriores: [],
    };
  }

  public async getResumenPeriodo(
    inicio: Date,
    final: Date,
    centro: number
  ): Promise<ResumenPeriodoModel[]> {
    const rangos = getDateRange(inicio, final);
    const resultados: ResumenPeriodoModel[] = [];
    for (let i = 0; i < rangos.length; i++) {
      const resultado: ResumenPeriodoModel[] = await this.conn.query(
        getResumenPeriodoQuery(centro),
        [rangos[i].start.toISOString().split('T')[0], rangos[i].end.toISOString().split('T')[0]]
      );
      const month = rangos[i].start.getMonth() + 1;
      const monthFormated = month < 10 ? `0${month}` : month;

      resultado[0].mes = `${monthFormated}-${rangos[i].start.getFullYear()}`;
      resultado[0].facturadoEvento = resultado[0].totalFacturado - resultado[0].facturadoPGP;
      resultados.push(resultado[0]);
    }
    return resultados;
  }

  async getResumenPeriodoPorEntidad(
    inicio: Date,
    final: Date
  ): Promise<ResumenPeriodoEntidadesModel[]> {
    const resultados: ResumenPeriodoEntidadesModel[] = [];

    const CONTEXTS = [
      GCM_CONTEXTS.ALTACENTRO,
      GCM_CONTEXTS.VALLEDUPAR,
      GCM_CONTEXTS.AGUACHICA,
      GCM_CONTEXTS.SANJUAN,
    ];

    for (let i = 0; i < CONTEXTS.length; i++) {
      let resultado: ResumenPeriodoEntidadesModel[];

      const qr = this.dynamicQR(CONTEXTS[i]);

      try {
        await qr.connect();

        if (CONTEXTS[i] === GCM_CONTEXTS.ALTACENTRO) {
          resultado = await qr.query(getResumenPeriodoPorEntidadQuery(CONTEXTS[i]), [
            inicio.toISOString().split('T')[0],
            final.toISOString().split('T')[0],
          ]);

          resultados.push(
            this._formatResumenPeriodoPorEntidades('NULOS ALTA / CENTRO', resultado[0])
          );

          resultado = await qr.query(getResumenPeriodoPorEntidadQuery(CONTEXTS[i], 1), [
            inicio.toISOString().split('T')[0],
            final.toISOString().split('T')[0],
          ]);

          resultados.push(this._formatResumenPeriodoPorEntidades('MEDICO CENTRO', resultado[0]));

          resultado = await qr.query(getResumenPeriodoPorEntidadQuery(CONTEXTS[i], 2), [
            inicio.toISOString().split('T')[0],
            final.toISOString().split('T')[0],
          ]);

          resultados.push(this._formatResumenPeriodoPorEntidades('ALTA COMPLEJIDAD', resultado[0]));
        } else {
          resultado = await qr.query(getResumenPeriodoPorEntidadQuery(CONTEXTS[i]), [
            inicio.toISOString().split('T')[0],
            final.toISOString().split('T')[0],
          ]);

          resultados.push(
            this._formatResumenPeriodoPorEntidades(CONTEXTS[i].getCode(), resultado[0])
          );
        }
      } catch (error) {
      } finally {
        await qr.release();
      }
    }

    return resultados;
  }

  private _formatResumenPeriodoPorEntidades(name: string, res: ResumenPeriodoEntidadesModel) {
    res.centro = name;
    res.facturadoIncluyendoRegistroPGP = res.facturado;
    res.refacturadoIncluyendoRegistroPGP = res.refacturado;
    res.facturado = res.facturado - res.registroPGP;
    res.refacturado = res.refacturado - res.refacturadoRegistroPGP;
    res.refacturadoEventos = res.refacturado - res.refacturadoPGP;
    res.facturadoEventos = res.facturado - res.facturadoPGP - res.refacturadoEventos;
    res.facturadoPGP = res.facturadoPGP - res.refacturadoPGP;

    return res;
  }
}
