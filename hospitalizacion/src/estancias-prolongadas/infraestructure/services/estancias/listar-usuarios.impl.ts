import { BaseSource } from '@common/infrastructure/services';
import { mapGestorEstanciaProlongadaUsuarios } from '@hpn/estancias-prolongadas/application/mappers';
import { Injectable } from '@nestjs/common';
import { GestorEstanciaProlongadaUsuarioOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ListarUsuariosEstanciaProlongadaImpl extends BaseSource {
  public async listarUsuarios() {
    const usuariosRp = this.conn.getRepository(GestorEstanciaProlongadaUsuarioOrm);
    const usuarios = await usuariosRp.find({
      where: { estado: true },
      order: { nombre: 'ASC' },
    });

    return mapGestorEstanciaProlongadaUsuarios(usuarios);
  }
}
