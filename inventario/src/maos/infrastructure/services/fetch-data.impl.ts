import { BaseSource, switchConn } from '@common/infrastructure/services';
import { LineaOrm, OfertaOrm, ProveedorOrm } from '@inn/orm/inn/maos';
import { Injectable } from '@nestjs/common';
import { dataToLineaRes } from '../factories';
import { LineaRes } from '@inn/maos/application/responses';
import { GCM_CONTEXTS } from '@common/domain/types';

@Injectable()
export class FetchDataImpl {
  async execute(): Promise<LineaRes[]> {
    const conn = switchConn(GCM_CONTEXTS.AMMEDICAL);
    const ekConn = switchConn(GCM_CONTEXTS.EKLIPSE);

    const lineaRp = ekConn.getRepository(LineaOrm);
    const ofertaRp = conn.getRepository(OfertaOrm);
    const proveedorRp = conn.getRepository(ProveedorOrm);

    const lineas = await lineaRp.find({
      relations: ['clasificaciones', 'clasificaciones.sets', 'clasificaciones.sets.productos'],
    });

    const ofertas = await ofertaRp.find({
      relations: ['detalle'],
    });

    const proveedores = await proveedorRp.find({ where: { maos: true } });

    ofertas.map(o => {
      o.proveedor = proveedores.find(p => p.id === o.proveedorId);
    });

    return lineas.map(l => dataToLineaRes(l, ofertas));
  }
}
