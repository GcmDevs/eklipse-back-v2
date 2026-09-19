import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ActualizarCupEjecutadoDto, BoletaQuirurgicaDetalleDto } from '../../presentation/dto';
import { mapBoletaQuirurgicaRows } from '../../application/mappers';
import { throwBoletaQuirurgicaError } from '../../application/errors';
import { actualizarCupEjecutadoQuery, cupsEjecutadosQuery } from '../queries/cups-ejecutados.query';

@Injectable()
export class CupsEjecutadosImpl extends BaseSource {
  async obtener(body: BoletaQuirurgicaDetalleDto) {
    this.validarIds([body.ingreso, body.folio]);
    try {
      const rows = await this.conn.query(cupsEjecutadosQuery(), [body.ingreso, body.folio]);
      return mapBoletaQuirurgicaRows(rows);
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error consultando los CUPS del procedimiento');
    }
  }

  async actualizar(body: ActualizarCupEjecutadoDto) {
    this.validarIds([body.ingreso, body.folio, body.cupEjecutadoOid, body.genseripsOid]);
    try {
      const rows = await this.conn.query(actualizarCupEjecutadoQuery(), [
        body.genseripsOid,
        body.cupEjecutadoOid,
        body.ingreso,
        body.folio,
      ]);
      if (!Number(rows[0]?.afectados)) {
        throw new NotFoundException(
          'El CUPS ejecutado no pertenece al ingreso y folio seleccionados, o el CUPS de reemplazo no existe'
        );
      }
      return { ...body, updated: true as const };
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error actualizando el CUPS ejecutado');
    }
  }

  private validarIds(ids: number[]) {
    if (!ids.every(id => Number.isInteger(id) && id > 0)) {
      throw new BadRequestException('Seleccione un procedimiento y CUPS válidos');
    }
  }
}
