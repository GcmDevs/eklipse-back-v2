import { BadRequestException, Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { CancelarGestionDto, CreateGestionDto } from '../dtos';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { UserStatusCode } from '@ctypes/gen';
import { CreateGestionService } from '@gestion-clinica/gestiones/infrastructure/services';

@CommonGuards()
@Controller('v4/gestion-clinica')
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
