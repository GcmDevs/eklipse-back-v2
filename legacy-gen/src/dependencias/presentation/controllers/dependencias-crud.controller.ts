import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { DependenciasCrudSource } from '../../infrastructure/repositories';
import { DependenciaOrm } from '@orm/gen';
import { GEN_AUTHORITIES } from '@authorities/general';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('Dependencias')
@Controller('v1/gen/dependencias')
export class DependenciasCrudController {
  constructor(private _dependenciasCrud: DependenciasCrudSource) {}

  @Authorities([GEN_AUTHORITIES.DEPENDENCIAS.GESTIONAR])
  @Get()
  public async fetch(): Promise<DependenciaOrm[]> {
    try {
      const dependencias = await this._dependenciasCrud.fetch();
      return dependencias;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([GEN_AUTHORITIES.DEPENDENCIAS.GESTIONAR])
  @Authorities()
  @Get('usuario/:id')
  public async fetchUserDependencias(@Param('id') id: string): Promise<DependenciaOrm[]> {
    try {
      const dependencias = await this._dependenciasCrud.fetchUserDependencias(id);
      return dependencias;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
