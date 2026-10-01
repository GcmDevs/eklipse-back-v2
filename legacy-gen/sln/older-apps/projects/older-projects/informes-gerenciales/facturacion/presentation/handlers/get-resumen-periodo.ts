import { BadRequestException, Injectable } from '@nestjs/common';
import { GetResumenPeriodo } from '../../application';
import { ResumenPeriodoEntidadesModel, ResumenPeriodoModel } from '../../domain';
import { FacturacionProxyRepository } from '../../infrastructure';

@Injectable()
export class GetResumenPeriodoHandler {
  constructor(private _facturacion: FacturacionProxyRepository) {}

  public async execute(
    inicio: Date,
    final: Date,
    centroId: number
  ): Promise<ResumenPeriodoModel[]> {
    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getResumenPeriodo = new GetResumenPeriodo(this._facturacion);

      return await getResumenPeriodo.execute(inicio, final, centroId);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async porEntidades(inicio: Date, final: Date): Promise<ResumenPeriodoEntidadesModel[]> {
    if (inicio > final) {
      throw new BadRequestException('El rango de fecha es invalido');
    }

    try {
      const getResumenPeriodo = new GetResumenPeriodo(this._facturacion);

      return await getResumenPeriodo.porEntidades(inicio, final);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
