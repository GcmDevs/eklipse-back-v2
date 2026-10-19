import { INN_AUTHORITIES } from '@authorities/inventario';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import { PaginationHelper } from '@common/presentation/helpers';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { TanqueoInconsistenciaService } from '@vehiculos/application';
import {
  TanqueoInconsistenciaRead,
  TanqueoInconsistenciasGrupoRead,
} from '@vehiculos/domain/reads';
import { FilterInconsistenciaDto, ResolveInconsistenciaDto } from '../dto';
import { TanqueoPresentationMapper } from '../mappers';

@Controller('/v4/inn/vehiculos/inconsistencias')
export class TanqueoInconsistenciaController extends BaseShelteredController {
  constructor(private readonly inconsistenciaService: TanqueoInconsistenciaService) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.INCONSISTENCIAS.VER])
  @Get()
  public async getAll(
    @Query() { page, limit, ...filters }: FilterInconsistenciaDto
  ): Promise<BaseApiResponse<TanqueoInconsistenciasGrupoRead[]>> {
    const [items, count] = await this.inconsistenciaService.getAllGrouped(
      page,
      limit,
      TanqueoPresentationMapper.toInconsistenciaFilters(filters)
    );
    return PaginationHelper.response(items, count, page, limit);
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.INCONSISTENCIAS.RESOLVER])
  @Patch('/:id/resolver')
  public async resolve(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ResolveInconsistenciaDto
  ): Promise<BaseApiResponse<TanqueoInconsistenciaRead>> {
    const updated = await this.inconsistenciaService.resolve(
      id,
      data.contactoRealizado,
      data.notaResolucion,
      data.notaContacto
    );
    return {
      data: updated,
      message: 'Inconsistencia gestionada exitosamente',
    };
  }
}
