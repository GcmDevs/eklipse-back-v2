import { BadRequestException, Injectable } from '@nestjs/common';
import { FolioDto } from '../dtos';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class FetchSubgruposCamasHandler extends BaseSource {
  async execute(): Promise<FolioDto> {
    try {
      const response = await this.conn.query(
        `SELECT OID id, HSUCODIGO codigo, HSUNOMBRE nombre FROM HPNSUBGRU`
      );
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
