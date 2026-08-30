import { CommonGuards } from '@common/presentation/decorators';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateRTCDto } from '../dtos';
import {
  CreateRecepcionTecnicaImpl,
  FetchRecepcionTecnicaImpl,
  UnrequiredRecepcionTecnicaImpl,
  UpdateRecepcionTecnicaImpl,
} from '@inn/lgc/rct/infrastructure/services';

@CommonGuards()
@Controller('v1/fmc/rec-tec')
export class RecepcionTecnicaCrudController {
  constructor(
    private _fetch: FetchRecepcionTecnicaImpl,
    private _create: CreateRecepcionTecnicaImpl,
    private _update: UpdateRecepcionTecnicaImpl,
    private _unrequired: UnrequiredRecepcionTecnicaImpl
  ) {}

  @Get()
  public fetch(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('onlyWithRecTec') onlyWithRecTec: boolean,
    @Query('onlyComprobantes') onlyComprobantes: boolean,
    @Query('onlyRemisiones') onlyRemisiones: boolean,
    @Query('pattern') pattern: string | undefined
  ) {
    if (pattern == 'undefined') pattern = undefined;
    if (onlyWithRecTec === undefined) onlyWithRecTec = false;
    if (onlyComprobantes === undefined) onlyComprobantes = true;
    if (onlyRemisiones === undefined) onlyRemisiones = true;
    try {
      start = new Date(`${start}:00:00:00`);
      end = new Date(`${end}:23:59:59`);

      return this._fetch.execute(
        start,
        end,
        onlyWithRecTec,
        onlyComprobantes,
        onlyRemisiones,
        pattern
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  public create(@Body() body: CreateRTCDto) {
    try {
      return this._create.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Put()
  public update(@Body() body: CreateRTCDto) {
    try {
      return this._update.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('rec-tec-unrequired/:id')
  public noRequiereRecTec(@Param('id') id: number) {
    try {
      return this._unrequired.execute(+id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
