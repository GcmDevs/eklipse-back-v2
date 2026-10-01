import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AlmacenCrudSource } from '@inn/cruds/productos/infrastructure/repositories';
import { CommonGuards } from '@common/presentation/decorators';
import { AlmacenProductoOrm } from '@inn/orm/inn';

@ApiTags('V3 - Almacenes')
@CommonGuards()
@Controller('v3/almacenes')
export class AlmacenCrudController {
  constructor(private _crud: AlmacenCrudSource) {}

  @Get()
  public fetch(
    @Query('pattern') pattern?: string,
    @Query('basicData') basicData?: boolean
  ): Promise<AlmacenProductoOrm[]> {
    try {
      return this._crud.fetch(pattern, basicData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
