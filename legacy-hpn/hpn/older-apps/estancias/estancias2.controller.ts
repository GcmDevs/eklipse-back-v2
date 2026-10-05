import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EstanciasService } from './estancias.service';
import { CommonGuards } from '@common/presentation/decorators';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/uci-sheets/estancias')
export class Estancias2Controller {
  constructor(private readonly servicio: EstanciasService) {}

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
}
