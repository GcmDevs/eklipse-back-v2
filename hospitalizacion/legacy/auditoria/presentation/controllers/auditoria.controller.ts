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
import {
  CreateAuditoriaImpl,
  FetchAuditoriaImpl,
  UpdateAuditoriaImpl,
} from '@hpn/lgc/aud/infrastructure/repositories';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { HPN_AUTHORITIES } from '@authorities';
import { CreateAuditoriaDto } from '../dtos';

@CommonGuards()
@Controller('v1/hpn/auditoria')
export class AuditoriaController {
  constructor(
    private _create: CreateAuditoriaImpl,
    private _update: UpdateAuditoriaImpl,
    private _fetch: FetchAuditoriaImpl
  ) {}

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Put(':id')
  public async update(@Param('id') id: number, @Body() body: CreateAuditoriaDto) {
    try {
      return await this._update.execute(id, body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Post()
  public async create(@Body() body: CreateAuditoriaDto) {
    try {
      return await this._create.execute(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([HPN_AUTHORITIES.AUDITORIA.GESTIONAR])
  @Get()
  public async fetch(
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFinal') fechaFinal: Date
  ) {
    try {
      fechaInicio = new Date(`${fechaInicio}:00:00:00`);
      fechaFinal = new Date(`${fechaFinal}:23:59:59`);
      return await this._fetch.execute(fechaInicio, fechaFinal);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
