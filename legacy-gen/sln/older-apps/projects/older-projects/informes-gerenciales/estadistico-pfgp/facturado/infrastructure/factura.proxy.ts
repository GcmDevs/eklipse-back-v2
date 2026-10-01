import { Injectable } from '@nestjs/common';
import {
  ContratosPayload,
  ContratoResponse,
  FacturasByContratoPayload,
  AgrupadoresByConsecutivoPayload,
} from '../application';
import { FacturaRepository } from '../domain';
import { contratosFacturadosConfig } from './file.config';
import {
  fetchAgrupadoresByConsecutivoQuery,
  fetchContratosQuery,
  fetchFacturasByContratoQuery,
  fetchFacturasByContratoQueryCond1,
  fetchLargasEstanciasByContratoQuery,
  fetchServiciosByConsecutivoQuery,
} from './queries';
import { BaseSource } from '@sln/old/common/infrastructure/bases';

@Injectable()
export class FacturadoProxyRepository extends BaseSource implements FacturaRepository {
  public async fetchServiciosByConsecutivo(payload: AgrupadoresByConsecutivoPayload): Promise<any> {
    return await this.conn.query(
      fetchServiciosByConsecutivoQuery(payload.idCentro, payload.codigosContratos),
      [
        payload.inicio.toISOString().split('T')[0],
        payload.final.toISOString().split('T')[0],
        payload.consecutivo,
      ]
    );
  }

  public async fetchAgrupadoresByConsecutivo(
    payload: AgrupadoresByConsecutivoPayload
  ): Promise<any> {
    return await this.conn.query(
      fetchAgrupadoresByConsecutivoQuery(
        this.auth.context,
        payload.idCentro,
        payload.codigosContratos
      ),
      [
        payload.inicio.toISOString().split('T')[0],
        payload.final.toISOString().split('T')[0],
        payload.consecutivo,
      ]
    );
  }

  public async fetchLargasEstanciasByContrato(payload: FacturasByContratoPayload): Promise<any> {
    return await this.conn.query(
      fetchLargasEstanciasByContratoQuery(
        this.auth.context,
        payload.idCentro,
        payload.codigosContratos
      ),
      [payload.inicio.toISOString().split('T')[0], payload.final.toISOString().split('T')[0]]
    );
  }

  public async fetchFacturasByContrato(payload: FacturasByContratoPayload): Promise<any> {
    const { inicio, final, idCentro, codigosContratos } = payload;

    const config = contratosFacturadosConfig(this.auth.context, inicio);

    const result: any[] = [];

    for (let i = 0; i < codigosContratos.length; i++) {
      let temp: any;

      if (config.excludeFromDeepSearchingFacturas.indexOf(codigosContratos[i]) >= 0) {
        temp = await this.conn.query(fetchFacturasByContratoQuery(this.auth.context, idCentro), [
          inicio.toISOString().split('T')[0],
          final.toISOString().split('T')[0],
          codigosContratos[i],
        ]);
      } else {
        if (config.deepSearchingFacturasQ1.indexOf(codigosContratos[i]) >= 0) {
          temp = await this.conn.query(
            fetchFacturasByContratoQueryCond1(this.auth.context, idCentro),
            [
              inicio.toISOString().split('T')[0],
              final.toISOString().split('T')[0],
              codigosContratos[0],
              codigosContratos[1],
            ]
          );
        }
      }

      result.push(...temp);
    }

    return result;
  }

  public async fetchContratos(payload: ContratosPayload): Promise<ContratoResponse[]> {
    const config = contratosFacturadosConfig(this.auth.context, payload.inicio);

    payload.fusiones = config?.fusiones;
    payload.aliasFusiones = config?.aliasFusiones;
    payload.codigosContratos = config?.codigosContratos;

    const {
      codigosContratos,
      idCentro: idCentros,
      fusiones,
      aliasFusiones,
      inicio,
      final,
    } = payload;

    const result: ContratoResponse[] = await this.conn.query(
      fetchContratosQuery(codigosContratos, idCentros),
      [inicio.toISOString().split('T')[0], final.toISOString().split('T')[0]]
    );

    const excludeFromResult: string[] = [];
    const newResults: ContratoResponse[] = [];

    if (fusiones.length && result.length) {
      fusiones.map((fusion: string[], i) => {
        let canDoIt = true;

        fusion.map(_ => {
          if (!result.filter(({ codigoContrato }) => codigoContrato === _)[0]) canDoIt = false;
        });

        if (canDoIt) {
          const temp = {
            codigoContrato: '',
            nombreContrato: '',
            totalEjecutado: 0,
            valorAnticipo: 0,
            totalContratado: 0,
            iteraciones: 0,
            errorAbsoluto: 0,
            errorRelativo: 0,
            porcentajeEjecutado: 0,
            codigosContratos: [],
          };

          if (aliasFusiones[i]) temp.nombreContrato = aliasFusiones[i];

          fusion.map((codigo: string, j: number) => {
            excludeFromResult.push(codigo);

            const _ = result.filter(contrato => contrato.codigoContrato === codigo)[0];

            if (!j) temp.codigoContrato = _.codigoContrato;
            else temp.codigoContrato = `${temp.codigoContrato} - ${codigo}`;

            temp.codigosContratos.push(_.codigoContrato);
            temp.totalEjecutado += _.totalEjecutado;
            temp.valorAnticipo += _.valorAnticipo;
            temp.totalContratado += _.totalContratado;
            temp.iteraciones += _.iteraciones;
            temp.errorAbsoluto += _.errorAbsoluto;
            temp.errorRelativo += _.errorRelativo;
            temp.porcentajeEjecutado += _.porcentajeEjecutado;
          });

          newResults.push(temp);
        }
      });

      newResults.push(...result.filter(_ => excludeFromResult.indexOf(_.codigoContrato) < 0));

      return newResults;
    }

    return result;
  }
}
