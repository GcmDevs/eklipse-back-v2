import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { CreateEmpleadoDto, CreateEntidadDto } from '../dtos';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
import { CreateEmpleadoOrEntidadService } from '@hpn/gestion-clinica/v1/infrastructure/services';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v1/hpn/gestion-clinica/add')
export class CreateEmpleadoOrEntidadController {
  constructor(private _create: CreateEmpleadoOrEntidadService) {}

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.REGI_ASIGNAR_MOVIL])
  @Post('empleado')
  public async createEmpleado(@Body() body: CreateEmpleadoDto) {
    try {
      return await this._create.addEmpleado(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([ADMIN_AUTHORITY, HPN_AUTHORITIES.GESTION_CLINICA.REGI_ASIGNAR_MOVIL])
  @Post('entidad')
  public async createEntidad(@Body() body: CreateEntidadDto) {
    try {
      return await this._create.addEntiad(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
