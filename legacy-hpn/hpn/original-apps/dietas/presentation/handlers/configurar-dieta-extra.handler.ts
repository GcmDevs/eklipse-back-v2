import { ConfigurarDietasExtraordinariasImpl } from '@lgc/die/infrastructure/services';
import { ConfDietExtraPayload } from '@lgc/die/application/data-transfers';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class ConfDietaExtraHandler {
  constructor(private _confDieExtra: ConfigurarDietasExtraordinariasImpl) {}

  public async execute(payload: ConfDietExtraPayload): Promise<boolean> {
    try {
      return await this._confDieExtra.execute(payload);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchDietaConfig(ingreso: number): Promise<any> {
    try {
      return await this._confDieExtra.fetchConfig(ingreso);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
