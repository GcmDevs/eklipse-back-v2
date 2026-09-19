import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { cierreAdministrativoQuery } from '../queries/cierre-administrativo.query';
import { CierreAdministrativoDto } from '../../presentation/dto';
import { throwBoletaQuirurgicaError } from '../../application/errors';

@Injectable()
export class CierreAdministrativoImpl extends BaseSource {
  async execute(body: CierreAdministrativoDto) {
    if (![body.ingreso, body.folio].every(value => Number.isInteger(value) && value > 0)) {
      throw new BadRequestException('Ingreso y folio deben ser enteros positivos');
    }
    try {
      const result = await this.conn.query(cierreAdministrativoQuery(), [body.ingreso, body.folio]);
      if (!Number(result[0]?.afectados)) {
        throw new NotFoundException('No se encontró la boleta para el ingreso y folio indicados');
      }
      return { ingreso: body.ingreso, folio: body.folio, estado: 'CERRADO' as const };
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error realizando el cierre administrativo');
    }
  }
}
