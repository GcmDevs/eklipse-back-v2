import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { DominioAccionNotificacionOrm } from '@orm/hpn/estancia-prolongadas';
import { UsuarioOrm } from '@orm/gen';

@Injectable()
export class NotificacionesService extends BaseSource {
  private async _findUsuarioByDocument(documento: string) {
    const usuarioRp = this.conn.getRepository(UsuarioOrm);

    const usuario = await usuarioRp.findOne({ where: { cedula: documento } });

    const usuarioId = usuario.id;

    return usuarioId;
  }

  public async obtenerResumen(documento: string) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await this._findUsuarioByDocument(documento);

    const [total, noVistas] = await Promise.all([
      notificacionRp.count({ where: { usuarioId } }),
      notificacionRp.count({ where: { usuarioId, visto: false } }),
    ]);
    console.log('no', total, noVistas);

    return { total, noVistas };
  }

  public async listarPorDocumento(documento: string) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await this._findUsuarioByDocument(documento);

    return notificacionRp.find({
      where: { usuarioId },
      order: { createdAt: 'DESC' },
      relations: [
        'estanciaProlongada',
        'estanciaProlongada.preguntas',
        'estanciaProlongada.acciones',
        'estanciaProlongada.seguimientos',
      ],
    });
  }

  public async marcarVista(documento: string, notificacionId: number) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await this._findUsuarioByDocument(documento);

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

    const usuarioId = await this._findUsuarioByDocument(documento);
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
