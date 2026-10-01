import { Injectable } from '@nestjs/common';
import { FetchInterconsultasPendientesService } from '@hcn/ori/intc/application/services';
import { InterConsultaPendienteDto } from '@hcn/ori/intc/application/data-transfers';
import { InterConsultaPendienteResponse } from '../data-transfers';
import { dataToEpicrisisPendienteDto } from '../factories';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class FetchInterconsultasPendientesApplication
  extends BaseSource
  implements FetchInterconsultasPendientesService
{
  public async all(especialidades?: number[]): Promise<InterConsultaPendienteDto[]> {
    const qr = `SELECT P.GPASEXPAC, V.* FROM GCVHCNINTERC V
    INNER JOIN GENPACIEN P ON V.GENPACIEN = P.OID
    WHERE HCNINTERR IS NULL AND AINESTADO = 0 AND HCIREGSUS = 0${
      especialidades ? ` AND GENESPECI IN(${especialidades})` : ''
    };`;

    const response: InterConsultaPendienteResponse[] = await this.conn.query(qr);

    const result = response.map(_ => dataToEpicrisisPendienteDto(_));

    return result;
  }

  public async porEspecialidadUsuarioAutenticado(): Promise<InterConsultaPendienteDto[]> {
    try {
      const medico = await this.conn.query(
        `select OID from GENMEDICO where GENUSUARIO = ${this.auth.id}`
      );

      const especialidades = await this.conn.query(
        `SELECT ESPECIALIDADES especialidad, MEDICOS medico FROM GENESPMED WHERE MEDICOS = ${medico[0].OID}`
      );

      return await this.all(especialidades.map(({ especialidad }) => especialidad));
    } catch (error) {
      throw new Error('El usuario autenticado no es medico y/o es un especialista');
    }
  }
}
