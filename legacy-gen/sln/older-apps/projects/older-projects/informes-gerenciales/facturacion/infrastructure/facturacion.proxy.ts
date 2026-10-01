import { Injectable } from '@nestjs/common';
import {
  FacturacionPeriodoModel,
  FacturacionRepository,
  FacturacionTerceroMesModel,
  ResumenPeriodoEntidadesModel,
  ResumenPeriodoModel,
} from '../domain';
import {
  getFacturasPendientesQuery,
  getFacturasPorPeriodoQuery,
  getResumenPeriodoQuery,
  getMetaFacturacionQuery,
  getIngresosSinFacturar,
  getFacturacionEntidadesQuery,
  getFacturacionTercerosQuery,
  getResumenPeriodoPorEntidadQuery,
} from './queries';
import { BaseSource } from '@sln/old/common/infrastructure/bases';
import { getDateRange } from '@sln/old/common/presentation/helpers';
import { CONTEXTS_DESCRIPTION, allContexts } from '@sln/old/common/application/constants';
import { GcmContexts } from '@common/application/constants';

@Injectable()
export class FacturacionProxyRepository extends BaseSource implements FacturacionRepository {
  public async getFacturacionTercerosByCentro(
    inicio: Date,
    final: Date,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    try {
      const CONTEXTS_WO_AMM = allContexts([GcmContexts.AMMEDICAL, GcmContexts.DEVELOPMENT]);
      let resultados: FacturacionTerceroMesModel[] = [];

      for (let ctx = 0; ctx < CONTEXTS_WO_AMM.length; ctx++) {
        let result: FacturacionTerceroMesModel[] = [];
        const isAltaCentro = CONTEXTS_WO_AMM[ctx] === GcmContexts.ALTACENTRO ? true : false;

        if (!isAltaCentro) {
          result = await this._getFacturacionTerceros(inicio, final, byDay, CONTEXTS_WO_AMM[ctx]);

          resultados.push(...result);
        } else {
          result = await this._getFacturacionTerceros(
            inicio,
            final,
            byDay,
            CONTEXTS_WO_AMM[ctx],
            1
          );
          resultados.push(...result);

          result = await this._getFacturacionTerceros(
            inicio,
            final,
            byDay,
            CONTEXTS_WO_AMM[ctx],
            2
          );
          resultados.push(...result);
        }
      }

      return resultados;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getFacturacionEntidadesByCentro(payload: {
    inicio: Date;
    final: Date;
    centroId: number;
    terceroId: number;
    byDay: boolean;
    context: GcmContexts;
  }): Promise<FacturacionTerceroMesModel[]> {
    const { inicio, final, centroId, terceroId, byDay, context } = payload;
    const qr = this.dynamicQR(context);
    await qr.connect();
    try {
      const rangos = getDateRange(inicio, final, byDay);

      const resultados: FacturacionTerceroMesModel[] = [];

      for (let i = 0; i < rangos.length; i++) {
        const facturacion = await qr.query(getFacturacionEntidadesQuery(centroId), [
          rangos[i].start.toISOString().split('T')[0],
          rangos[i].end.toISOString().split('T')[0],
          terceroId,
        ]);

        const mesNumber = rangos[i].start.getMonth() + 1;
        const mesWithZero = mesNumber < 10 ? `0${mesNumber}` : mesNumber.toString();
        const mes = `${mesWithZero}-${rangos[i].start.getFullYear()}`;

        resultados.push({ mes, facturacion });
      }

      return resultados;
    } catch (error) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  private async _getFacturacionTerceros(
    inicio: Date,
    final: Date,
    byDay: boolean,
    ctx: GcmContexts,
    centroId?: number
  ): Promise<FacturacionTerceroMesModel[]> {
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const rangos = getDateRange(inicio, final, byDay);
      const resultados: FacturacionTerceroMesModel[] = [];

      for (let i = 0; i < rangos.length; i++) {
        const facturacion = await qr.query(getFacturacionTercerosQuery(centroId), [
          rangos[i].start.toISOString().split('T')[0],
          rangos[i].end.toISOString().split('T')[0],
        ]);

        const mesNumber = rangos[i].start.getMonth() + 1;
        const mesWithZero = mesNumber < 10 ? `0${mesNumber}` : mesNumber.toString();
        const mes = `${mesWithZero}-${rangos[i].start.getFullYear()}`;

        const nombre =
          ctx === GcmContexts.ALTACENTRO
            ? centroId === 1
              ? 'Medicos Centro'
              : 'Alta Complejidad'
            : CONTEXTS_DESCRIPTION.filter(_ => _.value === ctx)[0].option;

        resultados.push({
          mes,
          idCentro: centroId || 1,
          nombreCentro: nombre.toUpperCase(),
          contexto: ctx,
          facturacion,
        });
      }

      return resultados;
    } catch (error) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async getFacturacionTerceros(
    inicio: Date,
    final: Date,
    centroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    const rangos = getDateRange(inicio, final, byDay);
    const resultados: FacturacionTerceroMesModel[] = [];

    for (let i = 0; i < rangos.length; i++) {
      const facturacion = await this.conn.query(getFacturacionTercerosQuery(centroId), [
        rangos[i].start.toISOString().split('T')[0],
        rangos[i].end.toISOString().split('T')[0],
      ]);

      const mesNumber = rangos[i].start.getMonth() + 1;
      const mesWithZero = mesNumber < 10 ? `0${mesNumber}` : mesNumber.toString();
      const mes = `${mesWithZero}-${rangos[i].start.getFullYear()}`;

      resultados.push({ mes, facturacion });
    }

    return resultados;
  }

  async getFacturacionEntidades(
    inicio: Date,
    final: Date,
    centroId: number,
    terceroId: number,
    byDay: boolean
  ): Promise<FacturacionTerceroMesModel[]> {
    const rangos = getDateRange(inicio, final, byDay);

    const resultados: FacturacionTerceroMesModel[] = [];

    for (let i = 0; i < rangos.length; i++) {
      const facturacion = await this.conn.query(getFacturacionEntidadesQuery(centroId), [
        rangos[i].start.toISOString().split('T')[0],
        rangos[i].end.toISOString().split('T')[0],
        terceroId,
      ]);

      const mesNumber = rangos[i].start.getMonth() + 1;
      const mesWithZero = mesNumber < 10 ? `0${mesNumber}` : mesNumber.toString();
      const mes = `${mesWithZero}-${rangos[i].start.getFullYear()}`;

      resultados.push({ mes, facturacion });
    }

    return resultados;
  }

  public async getFacturacionPeriodo(
    inicio: Date,
    final: Date,
    byDay = false
  ): Promise<FacturacionPeriodoModel> {
    const inicioFt = inicio.toISOString().split('T')[0];
    const finalFt = final.toISOString().split('T')[0];

    const metasPorMes: { centro: number; meta: number }[] = [];
    const centros: { id: number }[] = await this.conn.query(`SELECT OID id FROM ADNCENATE`);

    for (let i = 0; i < centros.length; i++) {
      const result = await this.conn.query(getMetaFacturacionQuery(inicio, [centros[i].id]));
      metasPorMes.push({ centro: centros[i].id, meta: result[0].META });
    }

    const facturas = await this.conn.query(getFacturasPorPeriodoQuery(), [inicioFt, finalFt]);

    const facturasPendientes = await this.conn.query(getFacturasPendientesQuery(), [
      inicioFt,
      finalFt,
    ]);

    const ingresosSinFacturar = await this.conn.query(getIngresosSinFacturar(), [
      inicioFt,
      finalFt,
    ]);

    return {
      metasPorMes,
      facturasPendientes,
      facturas,
      ingresosSinFacturar,
    };
  }

  async getResumenPeriodoPorEntidad(
    inicio: Date,
    final: Date
  ): Promise<ResumenPeriodoEntidadesModel[]> {
    const resultados: ResumenPeriodoEntidadesModel[] = [];

    const CONTEXTS = [
      GcmContexts.ALTACENTRO,
      GcmContexts.VALLEDUPAR,
      GcmContexts.AGUACHICA,
      GcmContexts.SANJUAN,
    ];

    for (let i = 0; i < CONTEXTS.length; i++) {
      let resultado: ResumenPeriodoEntidadesModel[];

      let qr = this.dynamicQR(CONTEXTS[i]);
      await qr.connect();

      try {
        if (CONTEXTS[i] === GcmContexts.ALTACENTRO) {
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

          resultados.push(this._formatResumenPeriodoPorEntidades(CONTEXTS[i], resultado[0]));
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

  public async getResumenPeriodo(
    inicio: Date,
    final: Date,
    centro: number,
    byDay = false
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
}
