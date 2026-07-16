import { BaseSource } from '@common/infrastructure/services';
import { findUsuarioByDocumento } from '@hpn/estancias-prolongadas/shared/utils/find-usuario-documento.util';
import { Injectable } from '@nestjs/common';
import { UsuarioOrm } from '@orm/gen/usuarios';
import { DominioAccionNotificacionOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ObtenerNotificacionesImpl extends BaseSource {
  public async obtenerResumen(documento: string) {
    const notificacionRp = this.conn.getRepository(DominioAccionNotificacionOrm);

    const usuarioId = await findUsuarioByDocumento(documento, this.conn);

    const [total, noVistas] = await Promise.all([
      notificacionRp.count({ where: { usuarioId } }),
      notificacionRp.count({ where: { usuarioId, visto: false } }),
    ]);

    return { total, noVistas };
  }
}
