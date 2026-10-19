import { OfertaDetalleOrm, OfertaOrm } from '../orm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { RegistrarOfertaDto } from '@inn/material-osteosintesis/presentation/dtos';

@Injectable()
export class RegistrarOfertaImpl extends BaseSource {
  public async execute(pl: RegistrarOfertaDto) {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const ofertaRp = this.conn.getRepository(OfertaOrm);
      const detalleRp = this.conn.getRepository(OfertaDetalleOrm);

      let oferta = await ofertaRp.findOne({
        where: { proveedorId: this.auth.id, setId: pl.setId, isActivo: true },
        relations: ['detalle'],
      });

      if (oferta && oferta.isModificado) throw new Error('No puede modificar mas de una vez');

      if (!oferta) {
        oferta = new OfertaOrm();
        oferta.setId = pl.setId;
        oferta.proveedorId = this.auth.id;
        oferta.fechaCreacion = new Date();
      }
      // Si la oferta ya existe, se marca como modificada para evitar futuras modificaciones
      //if (oferta && oferta.id) oferta.isModificado = true;

      const ofertaSaved = await ofertaRp.save(oferta);

      let detalle: OfertaDetalleOrm[] = [];

      pl.detalle.forEach(dt => {
        let item: OfertaDetalleOrm;
        if (oferta.detalle && oferta.detalle.length) {
          item = oferta.detalle.filter(el => el.productoId === dt.productoId)[0];
        } else {
          item = new OfertaDetalleOrm();
          item.ofertaId = ofertaSaved.id;
          item.productoId = dt.productoId;
        }
        item.precioUnitario = dt.precioUnitario;
        detalle.push(item);
      });

      await detalleRp.save(detalle);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
