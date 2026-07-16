import { BaseSource } from '@common/infrastructure/services';
import { mapSeguimiento } from '@hpn/estancias-prolongadas/shared/utils/seguimiento.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EstanciasProlongadasOrm, SeguimientoSemanaOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ListarSeguimientosImpl extends BaseSource {
  public async listarSeguimientos(estanciaProlongadaId: number) {
    const estanciaRp = this.conn.getRepository(EstanciasProlongadasOrm);
    const seguimientoRp = this.conn.getRepository(SeguimientoSemanaOrm);

    const estancia = await estanciaRp.findOne({ where: { id: estanciaProlongadaId } });
    if (!estancia) throw new NotFoundException('Estancia prolongada no encontrada');

    const seguimientos = await seguimientoRp.find({
      where: { estanciaProlongadaId },
      order: { semanaNumero: 'ASC' },
    });

    return seguimientos.map(seguimiento => mapSeguimiento(seguimiento));
  }
}
