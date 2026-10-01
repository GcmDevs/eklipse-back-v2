import { BadRequestException, Injectable } from '@nestjs/common';
import { FolioDto, FolioResponse, dataToFolioDto } from '../dtos';
import { fetchDiagnosticoByIdFolioQuery } from '../queries';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class FetchDiagnosticoByFolioHandler extends BaseSource {
  async execute(id: number): Promise<FolioDto> {
    try {
      const response: FolioResponse = await this.conn.query(fetchDiagnosticoByIdFolioQuery(id));
      return dataToFolioDto(response[0]);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
