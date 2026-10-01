import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { VerificacionOrm } from '@orm/inn/productos/estantes';
import { UsuarioOrm } from '@orm/gen';
import { orderBy } from 'lodash';

@Injectable()
export class HistoricoVerificarEstanteImpl extends BaseSource {
  async execute(estanteId: number) {
    const reporteExistenciaProductoRp = this.conn.getRepository(VerificacionOrm);
    const results = await reporteExistenciaProductoRp.find({
      where: { estanteId },
      relations: ['creadoPor'],
    });

    results.map(r => {
      delete r.estanteId;
      delete r.creadoPorId;
      const usuarioModificado = new UsuarioOrm();
      usuarioModificado.cedula = r.creadoPor.cedula;
      usuarioModificado.nombreCompleto = r.creadoPor.nombreCompleto;
      r.creadoPor = usuarioModificado;
    });

    return orderBy(results, 'fechaCreacion', 'desc');
  }
}
