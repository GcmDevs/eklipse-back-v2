import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GestionCarteraDto } from './dto/gestion.dto';
import { GestionService } from './gestion.service';
import { Authorities } from '@crn/old/common/presentation/decorators';
import { CommonGuards } from '@crn/old/common/presentation/decorators';
import { CRN_AUTHORITIES } from '@authorities/cartera';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/cartera/gestion')
export class GestionController {
  constructor(private readonly service: GestionService) {}

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get()
  async getGestions() {
    return await this.service.getGestions();
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Get('/tercero/:nit')
  async getTercero(@Param('nit') nit: string) {
    return await this.service.getTercero(nit);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Post()
  async addGestion(@Body() gestionDto: GestionCarteraDto) {
    return await this.service.addGestion(gestionDto);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Put(':oid')
  async updateGestion(@Param('oid') oid: number, @Body() gestionDto: GestionCarteraDto) {
    return await this.service.updateGestion(+oid, gestionDto);
  }

  @Authorities([
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_GESTIONES,
    CRN_AUTHORITIES.GESTIONES_CONCILIACIONES.ADMINISTRAR_CONCILIACIONES,
  ])
  @Delete('/:id')
  async deleteGestion(@Param('id') id: number) {
    return await this.service.deleteGestion(+id);
  }
}
