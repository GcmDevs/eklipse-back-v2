import { ApiTags } from '@nestjs/swagger';
import { CommonGuards } from '@common/presentation/decorators';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { EstanteCrudSource } from '@inn/cruds/productos/infrastructure/repositories';
import { EstanteAlmacenOrm } from '@inn/orm/inn';

@ApiTags('V3 - Productos')
@CommonGuards()
@Controller('v3/estantes')
export class EstanteCrudController {
  constructor(private _crud: EstanteCrudSource) {}

  @Get(':id')
  public async fetchById(
    @Param('id') id: number,
    @Query('includeExistencias') includeExistencias: boolean
  ): Promise<EstanteAlmacenOrm> {
    try {
      return await this._crud.fetchById(id, includeExistencias);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
