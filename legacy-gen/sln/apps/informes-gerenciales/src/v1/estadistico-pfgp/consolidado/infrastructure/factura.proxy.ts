import { Injectable } from '@nestjs/common';
import { AgrupadoresPayload, ContratoResponse, ContratosPayload } from '../application';
import { FacturaRepository } from '../domain';
import { contratosConsolidadosConfig } from './file.config';
import {
  fetchAgrupadoresByContratoQuery,
  fetchContratosQuery,
  fetchPacientesByContratoQuery,
  fetchServiciosByPacienteQuery,
} from './queries';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class ConsolidadoProxyRepository extends BaseSource implements FacturaRepository {
  public async fetchContratos(payload: ContratosPayload): Promise<any[]> {
    const config = contratosConsolidadosConfig(this.auth.context.getCode(), payload.inicio);

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

  public async fetchPacientesByContrato(payload: AgrupadoresPayload): Promise<any> {
    return this.conn.query(
      fetchPacientesByContratoQuery(payload.codigosContratos, payload.idCentro),
      [payload.inicio.toISOString().split('T')[0], payload.final.toISOString().split('T')[0]]
    );
  }

  public async fetchAgrupadoresByContrato(payload: AgrupadoresPayload): Promise<any> {
    return this.conn.query(
      fetchAgrupadoresByContratoQuery(payload.codigosContratos, payload.idCentro),
      [payload.inicio.toISOString().split('T')[0], payload.final.toISOString().split('T')[0]]
    );
  }

  public async fetchServiciosByConsecutivo(
    codigosContratos: string[],
    consecutivo: number
  ): Promise<any> {
    return this.conn.query(fetchServiciosByPacienteQuery(codigosContratos), [consecutivo]);
  }
}
