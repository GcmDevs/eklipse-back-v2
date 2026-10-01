import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { CamaOrm } from '@hpn/old/orm/cama.orm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadosCama } from '../../application/constants';
import { BloqueoCamaOrm } from '@hpn/old/orm/bloquear-cama.orm';
import { MotivoBloqueoCamaOrm } from '@hpn/old/orm/motivo-bloqueo.orm';
import { BloqueoCamaDto } from '../../application/dtos';
import { UsuarioOrm } from '@hpn/old/orm/general';

@Injectable()
export class BloquearCamaSourceRepository extends BaseSource {
  public async bloquearCama(ctx: GcmContexts, bloqueo: BloqueoCamaDto): Promise<any> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));

    try {
      await qr.connect();

      const { codigoCama, observacion, motivoBloqueo } = bloqueo;

      const camaRp = qr.manager.getRepository(CamaOrm);
      const bloqueoRp = qr.manager.getRepository(BloqueoCamaOrm);

      const cama = await camaRp.findOne({ where: { codigo: codigoCama } });

      if (!cama) {
        throw new BadRequestException('No existe la cama');
      }

      if (cama.estadoCode === EstadosCama.BLOQUEADA) {
        throw new BadRequestException('La cama ya está bloqueada');
      }

      cama.estadoCode = EstadosCama.BLOQUEADA;

      const bloqueada = new BloqueoCamaOrm();
      bloqueada.camaId = cama.id;
      bloqueada.usuarioId = this.auth.id;
      bloqueada.motivos = motivoBloqueo.map(mot => {
        const bloqueo = new MotivoBloqueoCamaOrm();
        bloqueo.bloqueoId = bloqueada.id;
        bloqueo.motivo = mot;
        return bloqueo;
      });
      bloqueada.createdAt = new Date();
      bloqueada.observacion = observacion;

      await camaRp.save(cama);
      await bloqueoRp.save(bloqueada);

      return true;
    } finally {
      await qr.release();
    }
  }

  public async getMotivos(ctx: GcmContexts, camaId: number) {
    try {
      const qr = this.dynamicQR(gcmContextFactory(ctx));
      await qr.connect();

      const bloqueo = await qr.manager.findOne(BloqueoCamaOrm, {
        where: { camaId: camaId },
        relations: ['motivos'],
        order: { createdAt: 'DESC' },
      });

      if (!bloqueo) throw new BadRequestException('No existe la cama');

      const usuario = await qr.manager.findOne(UsuarioOrm, {
        where: { id: bloqueo.usuarioId },
      });

      if (!usuario) throw new BadRequestException('No existe el usuario');

      return { bloqueo, usuario };
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
