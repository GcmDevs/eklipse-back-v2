import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SetDto } from '../dtos';

@ApiTags('V1 - Central de compras (Cotizaciones prefabricadas)')
@CommonGuards()
@Controller('v1/inn/ctc/ctpf/productos')
export class ProductoController {
  @Authorities()
  @Get()
  public async fetch(@Query('pattern') pattern: string) {}

  @Authorities()
  @Post()
  public async create(@Body() payload: SetDto) {}
}
