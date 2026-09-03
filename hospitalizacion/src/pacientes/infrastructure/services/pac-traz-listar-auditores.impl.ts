import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { UsuarioOrm } from '@orm/gen/usuarios';

@Injectable()
export class PacTrazListarAuditoresImpl extends BaseSource {
  async execute(): Promise<{ id: number; nombreCompleto: string; documento: string }[]> {
    const usuarios = await this.conn.getRepository(UsuarioOrm).find({
      where: { estadoCode: 1 },
      order: { nombreCompleto: 'ASC' },
    });

    return usuarios.map((usuario) => ({
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      documento: usuario.cedula,
    }));
  }
}
