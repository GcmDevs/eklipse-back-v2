import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { BasicTypeRes } from '@common/domain/types';
import {
  CtMzMedicamentoSeleccionRes,
  CtMzTypesRes,
  CtMzPacienteRes,
} from '@inn/central-mezclas/application/responses';
import {
  FetchMedicamentosByPatternImpl,
  FetchPacientesByPatternImpl,
} from '../../infrastructure/services';
import {
  ESTADOS_VALUES,
  FORMAS_FARMACEUTICAS_VALUES,
  LINEAS_VALUES,
  PRIORIDADES_VALUES,
  TIEMPOS_ADMIN_VALUES,
  UNIDADES_VALUES,
  VehiculoType,
  VEHICULOS_VALUES,
  VIAS_VALUES,
  VIAS_ADMINISTRACION_VALUES,
} from '@inn/types/inn/central-mezclas';

@ApiTags('Recursos')
@Controller('v1/inn/central-mezclas/recursos')
export class RecursosController {
  constructor(
    private _fetchPacientesByPattern: FetchPacientesByPatternImpl,
    private _fetchMedicamentosByPattern: FetchMedicamentosByPatternImpl
  ) {}

  @ApiResponse({ status: 200, type: CtMzTypesRes, isArray: true })
  @Get('types')
  fetchTypes() {
    try {
      return [
        { estados: ESTADOS_VALUES },
        { lineas: LINEAS_VALUES },
        { prioridades: PRIORIDADES_VALUES },
        { formasFarmaceuticas: FORMAS_FARMACEUTICAS_VALUES },
        { tiemposAdministracion: TIEMPOS_ADMIN_VALUES },
        { unidades: UNIDADES_VALUES },
        { vehiculos: VEHICULOS_VALUES },
        { vias: VIAS_VALUES },
        { viasAdministracion: VIAS_ADMINISTRACION_VALUES },
      ];
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiResponse({ status: 200, type: CtMzPacienteRes, isArray: true })
  @Get('pacientes/:pattern')
  async fetchPacientesByPattern(@Param('pattern') pattern: string) {
    try {
      return await this._fetchPacientesByPattern.execute(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiResponse({ status: 200, type: CtMzMedicamentoSeleccionRes, isArray: true })
  @Get('medicamentos/:pattern')
  async fetchMedicamentosByPattern(@Param('pattern') pattern: string) {
    try {
      return await this._fetchMedicamentosByPattern.execute(pattern);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiResponse({ status: 200, type: BasicTypeRes, isArray: true })
  @Get('vehiculos')
  fetchVehiculos(): VehiculoType[] {
    try {
      return VEHICULOS_VALUES;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
