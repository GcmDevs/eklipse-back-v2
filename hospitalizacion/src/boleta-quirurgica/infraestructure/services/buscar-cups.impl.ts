import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { buscarCupsQuery } from '../queries/buscar-cups.query';
import { mapBoletaQuirurgicaRows } from '../../application/mappers';
import { throwBoletaQuirurgicaError } from '../../application/errors';

@Injectable()
export class BuscarCupsImpl extends BaseSource {
  async execute(codigo: string) {
    if (typeof codigo !== 'string' || !codigo.trim()) {
      throw new BadRequestException('Ingrese un código CUPS para buscar');
    }
    try {
      const result = await this.conn.query(buscarCupsQuery(), [`%${codigo.trim()}%`]);
      return mapBoletaQuirurgicaRows(result);
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error buscando códigos CUPS');
    }
  }
}
