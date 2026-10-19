import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ReporteOrm } from '@orm/inn/productos/estantes';
import { orderBy } from 'lodash';
import { HistoricoExistenciaRes } from '@farmacia/inn-ciclico/application/responses';
import { reporteOrmToHistoricoExistenciaResFactory } from '../factories';

@Injectable()
export class FetchExistenciaProductoImpl extends BaseSource {
  async historico(productoId: number, estanteId: number): Promise<HistoricoExistenciaRes[]> {
    const reporteExistenciaProductoRp = this.conn.getRepository(ReporteOrm);

    const results = await reporteExistenciaProductoRp.find({
      where: {
        productoId,
        verificacion: {
          estanteId,
        },
      },
      relations: ['verificacion', 'verificacion.creadoPor'],
    });

    const res = orderBy(results, 'fechaCreacion', 'desc');

    return res.map(r => reporteOrmToHistoricoExistenciaResFactory(r));
  }
}
