import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { IngresosSuggestionsHandler } from './handlers';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller()
export class ResourcesController {
  constructor(private _ingresosSuggestions: IngresosSuggestionsHandler) {}

  @Get('v30/admisiones/resources/ingresos-suggestions/:id')
  public async ingresosSuggestions(@Param('id') id: number) {
    return this._ingresosSuggestions.byId(+id);
  }

  @Get('v10/resources/admisiones/ingresos/suggestions')
  public async ingresosSuggestionsByPattern(
    @Query('consecutivo') consecutivo: number,
    @Query('pattern') pattern: string,
    @Query('incluyeEgresados') incluyeEgresados: boolean
  ) {
    return this._ingresosSuggestions.byPattern(consecutivo, pattern, incluyeEgresados);
  }
}
