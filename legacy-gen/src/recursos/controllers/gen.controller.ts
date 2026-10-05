import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Get, Controller, BadRequestException, Query } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { EntidadBasicaRes } from '@common/application/responses';
import { AreaServicioImpl, DependenciaImpl } from '../services/gen';

@ApiTags('Recursos')
@CommonGuards()
@Controller('v4/gen/recursos')
export class RecursosController {
  constructor(
    private _areasServicio: AreaServicioImpl,
    private _dependencias: DependenciaImpl
  ) {}

  @ApiOkResponse({ type: EntidadBasicaRes })
  @ApiQuery({ name: 'pattern', required: false, type: String })
  @Get('areas-servicios')
  async fetchAreasServiciosByPattern(@Query('pattern') pattern: string) {
    try {
      return await this._areasServicio.fetchByPattern(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: EntidadBasicaRes })
  @ApiQuery({ name: 'pattern', required: false, type: String })
  @Get('dependencias')
  async fetchDependenciasByPattern(@Query('pattern') pattern: string) {
    try {
      return await this._dependencias.fetchByPattern(pattern);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
