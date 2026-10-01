import {
  ActualizarDietasImpl,
  CreateDietasBySubgrupoImpl,
} from '@hpn/ori/die/infrastructure/services';
import { UpdateDietaDto } from '@hpn/ori/die/application/data-transfers';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDietaDto } from '../dtos';

@Injectable()
export class DietasCrudHandler {
  constructor(
    private _createDietasBySubgrupo: CreateDietasBySubgrupoImpl,
    private _actualizarDieta: ActualizarDietasImpl
  ) {}

  public async createBySubgrupo(payload: CreateDietaDto) {
    try {
      return await this._createDietasBySubgrupo.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async updateDieta(dieta: UpdateDietaDto) {
    try {
      return await this._actualizarDieta.execute(dieta);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
