import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ReporteExistenciaProductoOrm } from '../orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { orderBy } from 'lodash';

@Injectable()
export class FetchHistoricoReporteExistenciaProductoImpl extends BaseSource {
  async execute(productoId: number, estanteId: number) {
    const reporteExistenciaProductoRp = this.conn.getRepository(ReporteExistenciaProductoOrm);
    const results = await reporteExistenciaProductoRp.find({
      where: { productoId, estanteId },
      relations: ['usuario'],
    });

    results.map(r => {
      delete r.estanteId;
      delete r.productoId;
      delete r.usuarioId;
      const usuarioModificado = new UsuarioOrm();
      usuarioModificado.cedula = r.usuario.cedula;
      usuarioModificado.nombreCompleto = r.usuario.nombreCompleto;
      r.usuario = usuarioModificado;
    });

    return orderBy(results, 'createdAt', 'desc');
  }
}
