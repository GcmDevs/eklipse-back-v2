import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import {
  boletaQuirurgicaAuditoriaQuery,
  boletaQuirurgicaGestorQxQuery,
  boletaQuirurgicaMaosQuery,
  boletaQuirurgicaProgramacionQuery,
  cirugiasRealizadasQuery,
  getAutorizadosQuery,
  getInfoProcedimientoQuery,
} from '../queries';
import { mapBoletaQuirurgicaDetalle } from '@hpn/boleta-quirurgica/application/mappers';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';

@Injectable()
export class FetchDetalleBoletaQuirurgicaImpl extends BaseSource {
  public async execute(ingreso: number, folio: number): Promise<any> {
    try {
      const params = [ingreso, folio];

      const [
        procedimientos,
        cupsAutorizados,
        programacion,
        cirugiasRealizadas,
        gestorqx,
        maos,
        auditoria,
      ] = await Promise.all([
        this.conn.query(getInfoProcedimientoQuery(), params),
        this.conn.query(getAutorizadosQuery(), params),
        this.conn.query(boletaQuirurgicaProgramacionQuery(), params),
        this.conn.query(cirugiasRealizadasQuery(ingreso)),
        this.conn.query(boletaQuirurgicaGestorQxQuery(), params),
        this.conn.query(boletaQuirurgicaMaosQuery(), params),
        this.conn.query(boletaQuirurgicaAuditoriaQuery(), params),
      ]);

      return mapBoletaQuirurgicaDetalle({
        procedimientos,
        cupsAutorizados,
        programacion,
        cirugiasRealizadas,
        gestorqx,
        maos,
        auditoria,
      });
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando el detalle de la boleta quirurgica');
    }
  }
}
