import { BadRequestException, Controller, Get, Param, Req } from '@nestjs/common';
import {
  FacturacionPeriodoModel,
  ResumenPeriodoEntidadesModel,
  ResumenPeriodoModel,
} from '@sln/informes-gerenciales/facturacion/domain/models';
import { FacturacionPeriodoImpl } from '@sln/informes-gerenciales/facturacion/infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SLN_AUTHORITIES } from '@authorities/facturacion';

@CommonGuards()
@Controller('v4/informes-gerenciales/facturacion-periodo')
export class FacturacionPeriodoController {
  constructor(private _facturacionPeriodo: FacturacionPeriodoImpl) {}

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.FACTURACION_PERIODO])
  @Get(':inicio/:final')
  getFacturacionPeriodo(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date
  ): Promise<FacturacionPeriodoModel> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    if (inicio > final) throw new BadRequestException('El rango de fecha es invalido');
    try {
      return this._facturacionPeriodo.getFacturacionPeriodo(inicio, final);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.FACTURACION_PERIODO])
  @Get('resumen/:inicio/:final/:centroId')
  getResumenPorPeriodo(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date,
    @Req() @Param('centroId') centroId: number
  ): Promise<ResumenPeriodoModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    try {
      return this._facturacionPeriodo.getResumenPeriodo(inicio, final, centroId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([SLN_AUTHORITIES.INFORMES_GERENCIALES.PUEDE_VER_X_FACT_ENTIDADES])
  @Get('resumen-entidades/:inicio/:final')
  getResumenPorPeriodoEntidades(
    @Req() @Param('inicio') inicio: Date,
    @Req() @Param('final') final: Date
  ): Promise<ResumenPeriodoEntidadesModel[]> {
    inicio = new Date(`${inicio}:00:00`);
    final = new Date(`${final}:00:00`);
    if (inicio > final) throw new BadRequestException('El rango de fecha es invalido');
    try {
      return this._facturacionPeriodo.getResumenPeriodoPorEntidad(inicio, final);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
