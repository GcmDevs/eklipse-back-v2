import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { CreateGestionService } from '@hpn/gestion-clinica/v1/infrastructure/services';
import { CancelarGestionDto, CreateGestionDto } from '../dtos';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { UserStatusCode } from '@hpn/old/types/general';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v1/hpn/gestion-clinica')
export class CreateGestionController {
  constructor(private _createGestionService: CreateGestionService) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_AREAS])
  @Get('fetch-usuarios')
  async fetchUsuarios(@Query('status') status: UserStatusCode[] = [1]) {
    const response = await this._createGestionService.fetchUsuarios(status);
    return response;
  }

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Post()
  public async CreateGestion(@Body() body: CreateGestionDto) {
    try {
      const response = await this._createGestionService.createGestion(body);
      response;
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  public async fetch(@Query('placa') placa: string) {
    try {
      const response = await this._createGestionService.fetch(placa);
      response;
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put('cancelar')
  public async Cancelar(@Body() body: CancelarGestionDto) {
    try {
      const response = await this._createGestionService.cancelar(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
