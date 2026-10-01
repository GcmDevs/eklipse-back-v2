import { BadRequestException, Body, Controller, Put } from '@nestjs/common';
import { AddDependenciaToUsuarioDto, RemoveDependenciaToUsuarioDto } from '../dtos';
import { ManageDependenciaToUsuarioImpl } from '../../infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { GEN_AUTHORITIES } from '@authorities/general';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('Dependencias')
@Controller('v1/gen/dependencias')
export class DependenciaServicesController {
  constructor(private _manageDependenciaToUsuario: ManageDependenciaToUsuarioImpl) {}

  @Authorities([GEN_AUTHORITIES.DEPENDENCIAS.GESTIONAR])
  @Put('add-to-usuario')
  public async addDependenciaToUsuario(@Body() payload: AddDependenciaToUsuarioDto) {
    try {
      const response = await this._manageDependenciaToUsuario.add(payload);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([GEN_AUTHORITIES.DEPENDENCIAS.GESTIONAR])
  @Put('remove-to-usuario')
  public async removeDependenciaToUsuario(@Body() payload: RemoveDependenciaToUsuarioDto) {
    try {
      const response = await this._manageDependenciaToUsuario.remove(payload);
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
