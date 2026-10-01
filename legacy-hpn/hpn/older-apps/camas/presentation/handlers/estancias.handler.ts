import { Injectable, BadRequestException } from '@nestjs/common';
import { EstanciasSourceRepository } from '../../insfrastructure/repositories';

@Injectable()
export class EstanciasHandler {
  public constructor(private _estanciasRepository: EstanciasSourceRepository) {}
  public async execute(consecutivo: number): Promise<any> {
    try {
      const result = await this._estanciasRepository.estanciasPaciente(consecutivo);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
