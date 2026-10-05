import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { PaginationHelper } from '@common/presentation/helpers';
import {
  EventoAuditEquipoRead,
  EventoAuditEquipoWorkflowRead,
  IncidenciaExternaEquipoRead,
} from '@equipos/domain/read';
import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EventoEquipoAuditViewMode, FilterEventoAuditEquipoDto } from '../dto';
import { INN_AUTHORITIES } from '@authorities/inventario';
import { Authorities } from '@common/presentation/decorators';
import { AuditEquipoService } from '@equipos/application/audit';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';

@Controller('/v4/inn/equipos/audit')
export class EventoAuditEquipoController extends BaseShelteredController {
  constructor(private readonly eventoAuditEquipoService: AuditEquipoService) {
    super();
  }

  @Authorities([
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.GESTIONAR,
    INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.AUDITORIA.VER,
  ])
  @Get('/:equipoId')
  public async getByEquipo(
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Query() filters: FilterEventoAuditEquipoDto
  ): Promise<
    BaseApiResponse<
      EventoAuditEquipoRead[] | EventoAuditEquipoWorkflowRead[] | IncidenciaExternaEquipoRead[]
    >
  > {
    const { page, limit, tipo, view, workflowOrderBy } = filters;

    if (view === EventoEquipoAuditViewMode.WORKFLOW && tipo)
      throw new BadRequestException('El filtro tipo no puede usarse en modo WORKFLOW');
    if (view !== EventoEquipoAuditViewMode.WORKFLOW && workflowOrderBy)
      throw new BadRequestException('workflowOrderBy solo puede usarse en modo WORKFLOW');

    const esIncidenciasExternas =
      view === EventoEquipoAuditViewMode.INCIDENCIAS_EXTERNAS ||
      tipo === TipoEventoAuditEquipo.INCIDENCIA_EXTERNA;

    if (esIncidenciasExternas) {
      if (tipo && tipo !== TipoEventoAuditEquipo.INCIDENCIA_EXTERNA)
        throw new BadRequestException(
          'El filtro tipo no puede usarse en modo INCIDENCIAS_EXTERNAS'
        );

      const incidencias =
        await this.eventoAuditEquipoService.getIncidenciasExternasByEquipo(equipoId);

      return { data: incidencias };
    }

    if (view === EventoEquipoAuditViewMode.WORKFLOW) {
      const [workflows, count] = await this.eventoAuditEquipoService.getWorkflowsByEquipo(
        equipoId,
        page,
        limit,
        workflowOrderBy
      );

      return PaginationHelper.response(workflows, count, page, limit);
    }

    const [eventos, count] = await this.eventoAuditEquipoService.getByEquipo(
      equipoId,
      page,
      limit,
      tipo
    );

    return PaginationHelper.response(eventos, count, page, limit);
  }
}
