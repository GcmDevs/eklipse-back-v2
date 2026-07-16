import { findUsuarioByDocumento } from '@hpn/estancias-prolongadas/shared/utils/find-usuario-documento.util';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { DominioAccionNotificacionOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ListarNotificacionesImpl extends BaseSource {
  public async listarPorDocumento(documento: string) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await findUsuarioByDocumento(documento, this.conn);

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
}
