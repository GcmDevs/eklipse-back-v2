import { BadRequestException, Body, Controller, Post, Put } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { TrasladoCrudImpl } from '@gestion-clinica/gestiones/infrastructure/services';
import {
  AsignacionVehiculoDto,
  NewAsignacionVehiculoDto,
  CreateNotaDto,
  CancelarDto,
  TrasladoInicarOrFinalizarDto,
  CreateAndAsignarUsuarioDto,
} from '../dtos';

@CommonGuards()
@Controller('v4/gestion-clinica/vehiculos')
export class VehiculoCrudController {
  constructor(private _vehiculoCrud: TrasladoCrudImpl) {}

  @Authorities([HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Put('old-asignar')
  public async oldAsignar(@Body() body: AsignacionVehiculoDto) {
    try {
      const response = await this._vehiculoCrud.oldAsignar(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES])
  @Put('asignar')
  public async asignar(@Body() body: NewAsignacionVehiculoDto) {
    try {
      const response = await this._vehiculoCrud.asignar(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_TRANSLADO_ASIGNADOS])
  @Post('add-nota-medica-traslado')
  public async addNota(@Body() body: CreateNotaDto) {
    try {
      return await this._vehiculoCrud.addNota(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_TRANSLADO_ASIGNADOS])
  @Put('cancelar/traslado')
  public async cancelar(@Body() body: CancelarDto) {
    try {
      return await this._vehiculoCrud.cancelar(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_TRANSLADO_ASIGNADOS])
  @Put('iniciar/traslado')
  public async iniciarOrFinalizar(@Body() body: TrasladoInicarOrFinalizarDto) {
    try {
      const response = await this._vehiculoCrud.iniciarOrFinalizar(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.REGI_ASIGNAR_MOVIL])
  @Post('create-and-asig-empleado')
  public async createAndAsignarEmpledo(@Body() body: CreateAndAsignarUsuarioDto) {
    try {
      const response = await this._vehiculoCrud.createAndAsignarEmpleado(body);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
