import { BadRequestException, Injectable } from '@nestjs/common';
import { GetFacturacionPeriodo } from '../../application';
import { FacturacionPeriodoModel } from '../../domain';
import { FacturacionProxyRepository } from '../../infrastructure';

@Injectable()
export class GetFacturacionPeriodoHandler {
  constructor(private _facturacion: FacturacionProxyRepository) {}

  public async execute(inicio: Date, final: Date): Promise<FacturacionPeriodoModel> {
    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getFacturacionPeriodo = new GetFacturacionPeriodo(this._facturacion);

      return await getFacturacionPeriodo.execute(inicio, final);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
