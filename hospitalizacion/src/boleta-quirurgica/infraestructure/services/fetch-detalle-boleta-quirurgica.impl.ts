import { auditoriaPreQuery } from '../queries/auditoria-pre.query';
import { cupsSolicitadosQuery } from '../queries/cups-solicitados.query';
import { boletaQuirurgicaPacienteQuery } from '../queries/boleta-quirurgica-paciente.query';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import {
  boletaQuirurgicaAuditoriaQuery,
  boletaQuirurgicaGestorQxQuery,
  boletaQuirurgicaMaosQuery,
  boletaQuirurgicaProgramacionQuery,
  cirugiasRealizadasQuery,
  getAutorizadosQuery,
} from '../queries';
import { mapBoletaQuirurgicaDetalle } from '@hpn/boleta-quirurgica/application/mappers';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';

@Injectable()
export class FetchDetalleBoletaQuirurgicaImpl extends BaseSource {
  public async execute(ingreso: number, folio: number): Promise<any> {
    try {
      const params = [ingreso, folio];

      const paciente = await this.conn.query(boletaQuirurgicaPacienteQuery(), params);

      const [
        procedimientos,
        cupsAutorizados,
        programacion,
        cirugiasRealizadas,
        gestorqx,
        maos,
        auditoria,
        auditoriaPre,
      ] = await Promise.all([
        this.conn.query(cupsSolicitadosQuery(paciente[0]?.TIPO), params),
        this.conn.query(getAutorizadosQuery(), params),
        this.conn.query(boletaQuirurgicaProgramacionQuery(), params),
        this.conn.query(cirugiasRealizadasQuery(), [ingreso]),
        this.conn.query(boletaQuirurgicaGestorQxQuery(), params),
        this.conn.query(boletaQuirurgicaMaosQuery(), params),
        this.conn.query(boletaQuirurgicaAuditoriaQuery(), params),
        this.conn.query(auditoriaPreQuery(), params),
      ]);

      return mapBoletaQuirurgicaDetalle({
        paciente,
        procedimientos,
        cupsAutorizados,
        programacion,
        cirugiasRealizadas,
        gestorqx,
        maos,
        auditoria,
        auditoriaPre,
      });
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando el detalle de la boleta quirurgica');
    }
  }
}
