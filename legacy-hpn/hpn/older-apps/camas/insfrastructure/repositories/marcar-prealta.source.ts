import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { CamaOrm } from '@hpn/old/orm/cama.orm';
import { PrealtaOrm } from '@hpn/old/orm/prealta.orm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrealtaDto } from '../../application/dtos';
import { UsuarioOrm } from '@hpn/old/orm/general';
import { EstadosCama } from '../../application/constants';

@Injectable()
export class MarcarPrealtaSourceRepository extends BaseSource {
  public async marcarPrealta(ctx: GcmContexts, body: PrealtaDto): Promise<any> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();

      const { codigoCama, motivoPrealta, observacion } = body;
      const camaRp = qr.manager.getRepository(CamaOrm);
      const prealtaRp = qr.manager.getRepository(PrealtaOrm);

      const cama = await camaRp.findOne({ where: { codigo: codigoCama } });

      if (!cama) throw new Error('No existe la cama');

      if (cama.estadoCode !== EstadosCama.OCUPADA)
        throw new Error('Para marcar una prealta es necesario que la cama esté ocupada');

      const prealta = new PrealtaOrm();
      prealta.camaId = cama.id;
      prealta.createdAt = new Date();
      prealta.usuarioId = this.auth.id;
      prealta.motivo = motivoPrealta;
      prealta.activo = true;
      prealta.observacion = observacion;

      await prealtaRp.save(prealta);

      return true;
    } catch (error) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
  public async getPrealtaById(ctx: GcmContexts, id: number): Promise<any> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();

      const prealtaRp = qr.manager.getRepository(PrealtaOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);
      const camaRp = qr.manager.getRepository(CamaOrm);

      const prealta = await prealtaRp.findOne({
        where: { camaId: id },
      });

      if (!prealta) throw new BadRequestException('No existe la cama');

      const usuario = await usuarioRp.findOne({
        where: { id: prealta.usuarioId },
      });

      if (!usuario) throw new BadRequestException('No existe el usuario');

      const cama = await camaRp.findOne({
        where: { id: prealta.camaId },
      });

      return {
        id: prealta.id,
        createdAt: prealta.createdAt,
        activo: prealta.activo,
        observacion: prealta.observacion,
        cama: {
          nombre: cama.nombre,
          codigo: cama.codigo,
          estado: cama.estadoCode,
        },
        motivos: prealta.motivo,
        usuario: {
          nombreCompleto: usuario.nombreCompleto,
          cedula: usuario.cedula,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async cancelarPrealta(ctx: GcmContexts, id: number): Promise<boolean> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();

      const prealtaRp = qr.manager.getRepository(PrealtaOrm);

      const prealta = await prealtaRp.findOne({
        where: { camaId: id },
      });

      prealta.activo = false;

      await prealtaRp.save(prealta);

      return true;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async getAllPrealta(ctx: GcmContexts): Promise<any> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();
      const prealtaRp = qr.manager.getRepository(PrealtaOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);
      const camaRp = qr.manager.getRepository(CamaOrm);

      const prealta = await prealtaRp.find({
        relations: ['motivos'],
      });

      if (!prealta) throw new BadRequestException('No existe la cama');

      const result = [];

      for (let i = 0; i < prealta.length; i++) {
        const element = prealta[i];

        const usuario = await usuarioRp.findOne({
          where: { id: element.usuarioId },
        });
        const cama = await camaRp.findOne({
          where: { id: element.camaId },
        });

        if (cama.estadoCode === EstadosCama.DESOCUPADA) element.activo = false;

        await prealtaRp.save(element);

        const pre = {
          id: element.id,
          createdAt: element.createdAt,
          activo: element.activo,
          cama: {
            id: cama.id,
            nombre: cama.nombre,
            codigo: cama.codigo,
            estado: cama.estadoCode,
          },
          motivos: element.motivo,
          usuario: {
            id: usuario.id,
            nombreCompleto: usuario.nombreCompleto,
            cedula: usuario.cedula,
          },
        };
        result.push(pre);
      }
      return result;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
