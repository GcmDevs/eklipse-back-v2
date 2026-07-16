import { BaseSource } from '@common/infrastructure/services';
import { findUsuarioByDocumento } from '@hpn/estancias-prolongadas/shared/utils/find-usuario-documento.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DominioAccionNotificacionOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class MarcarNotificacionVistaImpl extends BaseSource {
  public async marcarVista(documento: string, notificacionId: number) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await findUsuarioByDocumento(documento, this.conn);

    const notificacion = await notificacionRp.findOne({
      where: { id: notificacionId, usuarioId },
      relations: [
        'estanciaProlongada',
        'estanciaProlongada.preguntas',
        'estanciaProlongada.acciones',
        'estanciaProlongada.seguimientos',
      ],
    });

    if (!notificacion) throw new NotFoundException('Notificacion no encontrada para el paciente');

    notificacion.visto = true;
    notificacion.fechaVisto = new Date();

    return notificacionRp.save(notificacion);
  }

  public async marcarTodasVistas(documento: string) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await findUsuarioByDocumento(documento, this.conn);
    const notificaciones = await notificacionRp.find({
      where: { usuarioId, visto: false },
      relations: [
        'estanciaProlongada',
        'estanciaProlongada.preguntas',
        'estanciaProlongada.acciones',
        'estanciaProlongada.seguimientos',
      ],
    });

    const fechaVisto = new Date();
    await notificacionRp.save(
      notificaciones.map(notificacion => ({
        ...notificacion,
        visto: true,
        fechaVisto,
      }))
    );

    return { message: 'Notificaciones marcadas como vistas' };
  }
}
