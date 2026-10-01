import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { CreateEmpleadoDto, CreateEntidadDto } from '../dtos';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { CreateEmpleadoOrEntidadService } from '@gestion-clinica/gestiones/infrastructure/services';

@CommonGuards()
@Controller('v4/gestion-clinica')
export class CreateEmpleadoOrEntidadController {
  constructor(private _create: CreateEmpleadoOrEntidadService) {}

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.REGI_ASIGNAR_MOVIL])
  @Post('add-empleado')
  public async createEmpleado(@Body() body: CreateEmpleadoDto) {
    try {
      return await this._create.addEmpleado(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.REGI_ASIGNAR_MOVIL])
  @Post('add-entidad')
  public async createEntidad(@Body() body: CreateEntidadDto) {
    try {
      return await this._create.addEntiad(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
