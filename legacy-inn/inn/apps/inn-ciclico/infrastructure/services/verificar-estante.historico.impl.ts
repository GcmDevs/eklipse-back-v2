import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { VerificacionEstanteOrm } from '@inn/orm/inn';
import { UsuarioOrm } from '@inn/orm/gen';
import { orderBy } from 'lodash';

@Injectable()
export class HistoricoVerificacionEstanteImpl extends BaseSource {
  async execute(estanteId: number) {
    const reporteExistenciaProductoRp = this.conn.getRepository(VerificacionEstanteOrm);
    const results = await reporteExistenciaProductoRp.find({
      where: { estanteId },
      relations: ['usuario'],
    });

    results.map(r => {
      delete r.estanteId;
      delete r.usuarioId;
      const usuarioModificado = new UsuarioOrm();
      usuarioModificado.cedula = r.usuario.cedula;
      usuarioModificado.nombreCompleto = r.usuario.nombreCompleto;
      r.usuario = usuarioModificado;
    });

    return orderBy(results, 'createdAt', 'desc');
  }
}
