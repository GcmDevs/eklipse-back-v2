import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { GcmContexts } from '@inn/old/common/application/constants';

@ApiTags('V1 - Central de compras (Cotizaciones prefabricadas)')
@CommonGuards()
@Controller('v1/inn/ctc/ctpf/proveedor')
export class ProveedorController {
  @Authorities()
  @Get('by-pattern')
  public async fetch(@Query('pattern') pattern: string, @Query('context') context: GcmContexts) {}
}
