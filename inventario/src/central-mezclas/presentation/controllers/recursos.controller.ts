import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CtMzSolicitudRes, CtMzTypesRes } from '@inn/central-mezclas/application/responses';
import {
  ESTADOS_VALUES,
  LINEAS_VALUES,
  PRIORIDADES_VALUES,
  TIEMPOS_ADMIN_VALUES,
  UNIDADES_VALUES,
  VEHICULOS_VALUES,
  VIAS_ADMINISTRACION_VALUES,
} from '@inn/types/inn/central-mezclas';

@ApiTags('Recursos')
@Controller('v1/inn/central-mezclas/recursos')
export class RecursosController {
  @ApiResponse({ status: 200, type: CtMzTypesRes, isArray: true })
  @Get('types')
  fetchTypes() {
    try {
      return [
        { estados: ESTADOS_VALUES },
        { lineas: LINEAS_VALUES },
        { prioridades: PRIORIDADES_VALUES },
        { tiemposAdministracion: TIEMPOS_ADMIN_VALUES },
        { unidades: UNIDADES_VALUES },
        { vehiculos: VEHICULOS_VALUES },
        { viasAdministracion: VIAS_ADMINISTRACION_VALUES },
      ];
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
