import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { SolicitudService } from '@equipos/application/services/solicitud.service';
import { SolicitudRead } from '@equipos/domain/read';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { FilterSolicitudDto, RejectSolicitudDto } from '../dto';
import { PaginationHelper } from '@common/presentation/helpers';
import { Authorities } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';

@Controller('/v4/inn/equipos/solicitudes')
export class SolicitudesController extends BaseShelteredController {
  constructor(private readonly aprobacionService: SolicitudService) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.SOLICITUDES.RESOLVER])
  @Patch('/:id/approve')
  async approve(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<SolicitudRead>> {
    const solicitud = await this.aprobacionService.approve(id);
    return { data: solicitud, message: `Solicitud con id ${id} aprobada y ejecutada` };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.SOLICITUDES.RESOLVER])
  @Patch('/:id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() { motivoRechazo }: RejectSolicitudDto
  ): Promise<BaseApiResponse<SolicitudRead>> {
    const solicitud = await this.aprobacionService.reject(id, { motivoRechazo });
    return { data: solicitud, message: `Solicitud con id ${id} rechazada con exito` };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.SOLICITUDES.VER])
  @Get('/:id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<BaseApiResponse<SolicitudRead>> {
    return { data: await this.aprobacionService.getOneById(id) };
  }

  @Authorities([INN_AUTHORITIES.GESTION_ACTIVOS.EQUIPOS.SOLICITUDES.VER])
  @Get()
  async getAll(
    @Query() { page, limit, ...filters }: FilterSolicitudDto
  ): Promise<BaseApiResponse<SolicitudRead[]>> {
    const [solicitudes, count] = await this.aprobacionService.getAll({ page, limit, ...filters });
    return PaginationHelper.response(solicitudes, count, page, limit);
  }
}
