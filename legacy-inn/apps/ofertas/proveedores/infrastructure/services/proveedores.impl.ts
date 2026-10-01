import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { EkinnoferProveedorOrm } from '@orm/inn/ofertas/proveedor.orm';
import { ProveedorMapper } from '../../mapper/proveedor.mapper';
import { EkinnoferOfertaOrm } from '@orm/inn/ofertas/ofertas.orm';

@Injectable()
export class ProveedoresImpl extends BaseSource {
  public async fetch(isProveedorAutenticado: boolean) {
    const ctx = GCM_CONTEXTS.AMMEDICAL;
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const proveedoresRp = qr.manager.getRepository(EkinnoferProveedorOrm);
      const proveedores = await proveedoresRp.find({
        relations: ['documentos'],
        where: { estado: 1, id: isProveedorAutenticado ? this.auth.user.id : undefined },
        order: { nombreTercero: 'DESC' },
      });

      if (!proveedores.length) throw new NotFoundException('No existen proveedores.');

      return ProveedorMapper.toProveedor(proveedores);
    } catch (error: any) {
      Logger.error('Error fetching proveedores:', error);
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }

  public async fetchOfertaByProveedor(proveedorId: number) {
    const ctx = GCM_CONTEXTS.AMMEDICAL;
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      const ofertaRp = qr.manager.getRepository(EkinnoferOfertaOrm);
      const ofertas = await ofertaRp.find({
        where: { estado: 1, proveedorId },
        relations: ['producto'],
      });

      return ofertas;
    } catch (error: any) {
      Logger.error('Error fetching ofertas:', error);
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
