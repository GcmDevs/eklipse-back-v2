import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ProductoCrudSource } from '@inn/cruds/productos/infrastructure/repositories';
import { CommonGuards } from '@common/presentation/decorators';
import { ProductoOrm } from '@inn/orm/inn';

@ApiTags('V3 - Productos')
@CommonGuards()
@Controller('v3/productos')
export class ProductoCrudController {
  constructor(private _crud: ProductoCrudSource) {}

  @Get()
  public fetch(
    @Query('pattern') pattern: string,
    @Query('basicData') basicData: boolean
  ): Promise<ProductoOrm[]> {
    try {
      return this._crud.fetch(pattern, basicData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
