import { EpicrisisDto } from '@hcn/ori/epi/application/data-transfers';
import { CambiarEstadoEpicrisisService } from '@hcn/ori/epi/application/services';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CambiarEstadoEpicrisisHandler {
  constructor(private _service: CambiarEstadoEpicrisisService) {}

  public async findByConsecutivo(consecutivo: number): Promise<EpicrisisDto> {
    try {
      return await this._service.findByConsecutivo(consecutivo);
    } catch (error) {
      throw new NotFoundException();
    }
  }

  public async confirmar(consecutivo: number): Promise<boolean> {
    try {
      return await this._service.confirmar(consecutivo);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async desconfirmar(consecutivo: number): Promise<boolean> {
    try {
      return await this._service.desconfirmar(consecutivo);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
