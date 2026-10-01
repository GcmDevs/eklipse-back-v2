import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EstanciasService } from './estancias.service';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/estancias')
export class EstanciasController {
  constructor(private readonly servicio: EstanciasService) {}

  @Get('resources')
  async resources() {
    return {
      wayOutTypes: [
        { value: 3, option: 'Domicilio' },
        { value: 6, option: 'Hospicasa' },
        { value: 4, option: 'Morgue' },
        { value: 5, option: 'Remitido' },
      ],
    };
  }

  @Get()
  async traer_paciente_acostados() {
    try {
      const data = await this.servicio.traer_paciente_acostados();
      if (data.length > 0) {
        return {
          success: true,
          data,
          message: 'Censo Hospitalario',
        };
      } else {
        return {
          success: false,
          data,
          message: 'No hay datos',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  @Get('subgrupo')
  async traer_paciente_acostados_por_subgrupo(@Query('codigoSubgrupo') codigoSubgrupo: string) {
    try {
      const data = await this.servicio.traer_paciente_acostados(codigoSubgrupo);
      if (data.length > 0) {
        return {
          success: true,
          data,
          message: 'Censo Hospitalario',
        };
      } else {
        return {
          success: false,
          data,
          message: 'No hay datos',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  @Get('paciente')
  async traer_paciente_acostado(@Query('keyword') keyword: string) {
    try {
      const data = await this.servicio.traer_paciente_acostados(undefined, keyword);
      if (data.length > 0) {
        return {
          success: true,
          data,
          message: 'Censo Hospitalario',
        };
      } else {
        return {
          success: false,
          data,
          message: 'No hay datos',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  @Get('gastos-por-ingreso/:ingreso')
  async gastosPorIngreso(@Param('ingreso') ingreso: number) {
    try {
      return await this.servicio.gastosTotalesPorIngreso(+ingreso);
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  @Get('dial-way-out/:patient/:consecutive/:checkoutype')
  async dialWayOut(
    @Param('patient') patient: number,
    @Param('consecutive') consecutive: number,
    @Param('checkoutype') checkOutType: number
  ) {
    return await this.servicio.dialWayOut(+patient, +consecutive, +checkOutType);
  }

  @Get('disconfirm-way-out/:patient/:consecutive')
  async disconfirmWayOut(
    @Param('patient') patient: number,
    @Param('consecutive') consecutive: number
  ) {
    return await this.servicio.disconfirmWayOut(+patient, +consecutive);
  }
}
