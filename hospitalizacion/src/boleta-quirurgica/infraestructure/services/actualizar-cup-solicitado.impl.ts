import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { actualizarCupSolicitadoQuery } from '../queries/actualizar-cup-solicitado.query';
import { ActualizarCupSolicitadoDto } from '../../presentation/dto';
import { throwBoletaQuirurgicaError } from '../../application/errors';

@Injectable()
export class ActualizarCupSolicitadoImpl extends BaseSource {
  async execute(body: ActualizarCupSolicitadoDto) {
    if (
      !['PQX', 'NPQX', 'EXA'].includes(body.origen) ||
      ![body.ingreso, body.folio, body.solicitudOid, body.genseripsOid].every(
        value => Number.isInteger(value) && value > 0
      )
    ) {
      throw new BadRequestException('Seleccione una solicitud y un CUPS válidos');
    }
    const usuarioCambioCups = String(this.auth.id);
    try {
      const result = await this.conn.query(actualizarCupSolicitadoQuery(body.origen), [
        body.genseripsOid,
        body.solicitudOid,
        body.ingreso,
        body.folio,
      ]);
      if (!Number(result[0]?.afectados)) {
        throw new NotFoundException(
          'No se encontró la solicitud en este ingreso y folio, o el CUPS seleccionado no existe'
        );
      }
      return { ...body, updated: true as const, usuarioCambioCups };
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error actualizando el CUPS solicitado');
    }
  }
}
