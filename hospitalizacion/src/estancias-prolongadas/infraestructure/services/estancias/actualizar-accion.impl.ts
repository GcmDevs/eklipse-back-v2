import { BaseSource } from '@common/infrastructure/services';
import { ActualizarAccionDominioDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DominioAccionesOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ActualizarAccionImpl extends BaseSource {
  public async actualizarAccion(
    estanciaProlongadaId: number,
    actionId: number,
    body: ActualizarAccionDominioDto
  ) {
    const actionRp = this.conn.getRepository(DominioAccionesOrm);

    const action = await actionRp.findOne({
      where: {
        id: actionId,
        estanciaProlongadaId,
      },
      relations: ['estanciaProlongada', 'dominio'],
    });

    if (!action) throw new NotFoundException('Acción no encontrada para la estancia solicitada');

    if (body.estados !== undefined) action.estado = body.estados;
    if (body.responsable !== undefined) action.responsable = body.responsable?.trim() ?? null;
    if (body.estimatedDate !== undefined) {
      action.tiempoEstimado = body.estimatedDate ? new Date(body.estimatedDate) : null;
    }
    if (body.observacion !== undefined) action.observaciones = body.observacion?.trim() ?? null;

    const data = await actionRp.save(action);

    return data;
  }
}
