import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConceptoDeAdmisionService } from './concepto-de-admision.service';
import { IMedicamentos } from './interface';
import { Authorities, CommonGuards } from '@sln/old/common/presentation/decorators';
import { AUTHORITIES } from '@sln/old/authorities/principal';

@ApiTags('V1/V2/V3')
@CommonGuards()
@Controller('v10/concepto-admision')
export class ConceptoDeAdmisionController {
  constructor(private readonly conceptoService: ConceptoDeAdmisionService) {}

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.PRODUCTOS.CAMBIAR_CONCEPTO_FACTURACION,
  ])
  @Get(':oid/:tipo')
  async getmedicamentos(@Param('oid') id: string, @Param('tipo') tipo: string) {
    return await this.conceptoService.getmedicamentos(id, tipo);
  }

  @Authorities([
    AUTHORITIES.GENERAL.SEGURIDAD.ADMINISTRADOR,
    AUTHORITIES.FACTURACION.PRODUCTOS.CAMBIAR_CONCEPTO_FACTURACION,
  ])
  @Post()
  async update(@Body() medicamentos: IMedicamentos[]) {
    return await this.conceptoService.updatemedicamento(medicamentos);
  }
}
