import { In, Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OfertaOrm, SetLineaOrm } from '../orm';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class LineaCrudSource extends BaseSource {
  public async fetch(pattern: string) {
    const lineaRp = this.ekConn.getRepository(SetLineaOrm);
    const ofertaRp = this.conn.getRepository(OfertaOrm);

    const lineas = await lineaRp.find({
      where: pattern ? { nombre: Like(`%${pattern}%`) } : undefined,
      take: pattern ? 5 : undefined,
      relations: ['clasificaciones', 'clasificaciones.sets', 'clasificaciones.sets.productos'],
    });

    const setsIds: number[] = [];

    lineas.forEach(l => {
      l.clasificaciones.forEach(c => {
        c.sets.forEach(s => {
          setsIds.push(s.id);
        });
      });
    });

    const ofertas = await ofertaRp.find({
      where: { proveedorId: this.auth.id, setId: In(setsIds), isActivo: true },
    });

    lineas.map(l => {
      l.clasificaciones.map(c => {
        c.sets.map(s => {
          const haveOferta = ofertas.find(o => o.setId === s.id);
          if (haveOferta) s.haveOferta = true;
          s.productos.map(p => {
            //p.codigo = `COD${l.id}${c.id}${s.id}${p.id}`;
          });
        });
      });
    });

    return lineas;
  }

  public async fetchEstadoOferta(setId: number) {
    const ofertaRp = this.conn.getRepository(OfertaOrm);

    const oferta = await ofertaRp.findOne({
      where: { proveedorId: this.auth.id, setId, isActivo: true },
      relations: ['detalle'],
    });

    return oferta;
  }
}
