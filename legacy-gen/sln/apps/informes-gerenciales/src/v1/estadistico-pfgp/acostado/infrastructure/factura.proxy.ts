import { Injectable } from '@nestjs/common';
import { contratosFacturadosConfig } from '../../facturado/infrastructure/file.config';
import { ContratosPayload, ContratoResponse, PacientesByContratoPayload } from '../application';
import { FacturaRepository } from '../domain';
import { contratosAcostadosConfig } from './file.config';
import {
  fetchAgrupadoresByConsecutivoQuery,
  fetchContratosQuery,
  fetchEstanciasByConsecutivoQuery,
  fetchPacientesByContratoQuery,
  fetchServiciosByConsecutivoQuery,
  getDiferenciaConsolidadoQuery,
} from './queries';
import { BaseSource } from '@common/infrastructure/services';

interface DiferenciaModel {
  codigoContrato: string;
  codigosContratos?: string[];
  disponibilidad: number;
}

@Injectable()
export class AcostadoProxyRepository extends BaseSource implements FacturaRepository {
  public async getDiferenciaConsolidado(payload: PacientesByContratoPayload): Promise<any> {
    const config = contratosFacturadosConfig(this.auth.context.getCode(), payload.inicio);

    const fusiones = config?.fusiones;

    payload.codigosContratos = config?.codigosContratos;

    const { codigosContratos, idCentro, inicio, final } = payload;

    const result: DiferenciaModel[] = await this.conn.query(
      getDiferenciaConsolidadoQuery(idCentro, codigosContratos),
      [inicio.toISOString().split('T')[0], final.toISOString().split('T')[0]]
    );

    const excludeFromResult: string[] = [];
    const newResults: DiferenciaModel[] = [];

    if (fusiones.length && result.length) {
      fusiones.map((fusion: string[], i) => {
        let canDoIt = true;

        fusion.map(_ => {
          if (!result.filter(({ codigoContrato }) => codigoContrato === _)[0]) canDoIt = false;
        });

        if (canDoIt) {
          const temp: DiferenciaModel = {
            codigoContrato: '',
            codigosContratos: [],
            disponibilidad: 0,
          };

          fusion.map((codigo: string, j: number) => {
            excludeFromResult.push(codigo);

            const _ = result.filter(contrato => contrato.codigoContrato === codigo)[0];

            if (!j) temp.codigoContrato = _.codigoContrato;
            else temp.codigoContrato = `${temp.codigoContrato} - ${codigo}`;

            temp.codigosContratos.push(_.codigoContrato);
            temp.disponibilidad += _.disponibilidad;
          });

          newResults.push(temp);
        } else {
        }
      });

      newResults.push(...result.filter(_ => excludeFromResult.indexOf(_.codigoContrato) < 0));

      newResults.map(_ => {
        if (!_.codigosContratos) {
          _.codigosContratos = [_.codigoContrato];
        }
      });

      return newResults;
    }

    result.map(_ => {
      if (!_.codigosContratos) {
        _.codigosContratos = [_.codigoContrato];
      }
    });

    return result;
  }

  public async fetchServiciosByConsecutivo(
    consecutivo: number,
    codigosContratos: string[]
  ): Promise<any> {
    return await this.conn.query(fetchServiciosByConsecutivoQuery(codigosContratos), [consecutivo]);
  }

  public async fetchAgrupadoresByConsecutivo(
    consecutivo: number,
    codigosContratos: string[]
  ): Promise<any> {
    return await this.conn.query(
      fetchAgrupadoresByConsecutivoQuery(this.auth.context.getCode(), codigosContratos),
      [consecutivo]
    );
  }

  public async fetchEstanciasByConsecutivo(consecutivo: number): Promise<any> {
    return await this.conn.query(fetchEstanciasByConsecutivoQuery(), [consecutivo]);
  }

  public async fetchPacientesByContrato(payload: PacientesByContratoPayload): Promise<any> {
    const { inicio, final, idCentro: idCentros, codigosContratos } = payload;

    const result: any[] = [];

    for (let i = 0; i < codigosContratos.length; i++) {
      const temp = await this.conn.query(fetchPacientesByContratoQuery(idCentros), [
        inicio.toISOString().split('T')[0],
        final.toISOString().split('T')[0],
        codigosContratos[i],
      ]);

      result.push(...temp);
    }

    return result;
  }

  public async fetchContratos(payload: ContratosPayload): Promise<ContratoResponse[]> {
    const config = contratosAcostadosConfig(this.auth.context.getCode(), payload.inicio);

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
