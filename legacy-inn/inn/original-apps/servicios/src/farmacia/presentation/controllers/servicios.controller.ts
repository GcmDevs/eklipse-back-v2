import { ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { CommonGuards } from '@common/presentation/decorators';

@ApiTags('V1 - Reportes almacen')
@CommonGuards()
@Controller('v1/servicios')
export class ServiciosController extends BaseSource {
  @Get()
  public async fetch() {
    return [
      { nombre: '1', apellido: 'a', ciudad: 'a' },
      { nombre: '2', apellido: 'b', ciudad: 'b' },
      { nombre: '3', apellido: 'c', ciudad: 'c' },
    ];
  }
}
