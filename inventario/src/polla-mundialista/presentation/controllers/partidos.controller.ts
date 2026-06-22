import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PartidoRes } from '../../application/responses';
import { FetchPartidosImpl, PronosticarPartidoImpl } from '../../infrastructure/services';
import { PronosticoPayload } from '../dtos';

@ApiTags('Polla mundialista')
@Controller('v1/inn/polla-mundialista/partidos')
export class PartidosController {
  constructor(
    private _fetchPartidos: FetchPartidosImpl,
    private _pronosticarPartido: PronosticarPartidoImpl
  ) {}

  @ApiResponse({ status: 200, type: PartidoRes, isArray: true })
  @Get()
  async fetch(): Promise<PartidoRes[]> {
    try {
      return await this._fetchPartidos.execute();
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiBody({ type: PronosticoPayload })
  @ApiResponse({ status: 201, type: Boolean })
  @Post(':partidoId/pronostico')
  async pronosticar(
    @Param('partidoId', ParseIntPipe) partidoId: number,
    @Body() payload: PronosticoPayload
  ): Promise<boolean> {
    try {
      return await this._pronosticarPartido.execute(partidoId, payload);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
