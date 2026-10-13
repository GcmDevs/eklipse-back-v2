import { Injectable } from '@nestjs/common';
import { GcmContextCode } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudPedidoBorradorOrm } from '@inn/orm/inn/solicitud-pedido';
import { CentroOrm } from '@inn/orm/adn';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';
import { GuardarBorradorSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';

export interface BorradorSolicitudPedidoResponse {
  version: 1;
  sedeId: number;
  contextCode: GcmContextCode;
  porAgrupamiento?: boolean;
  productos: any[];
  guardadoEn: string;
}

@Injectable()
export class SolicitudPedidoBorradorImpl extends BaseSource {
  async obtener(
    contextCode: GcmContextCode,
    sedeId?: number
  ): Promise<BorradorSolicitudPedidoResponse | null> {
    const ctx = contextoSolicitudPedidoFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const borradorRp = qr.manager.getRepository(SolicitudPedidoBorradorOrm);
      const where: any = {
        usuarioId: this.auth.id,
        contexto: contextCode,
      };
      if (sedeId) {
        where.sedeId = sedeId;
      }
      const borrador = await borradorRp.findOne({
        where,
        order: { fechaActualizacion: 'DESC' },
      });

      if (!borrador) return null;

      const datos = JSON.parse(borrador.datosJson);
      return {
        version: 1,
        sedeId: borrador.sedeId,
        contextCode,
        porAgrupamiento: datos.porAgrupamiento ?? true,
        productos: datos.productos ?? [],
        guardadoEn: borrador.fechaActualizacion.toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Error al obtener el borrador: ${error.message}`);
    } finally {
      await qr.release();
    }
  }

  async guardar(
    payload: GuardarBorradorSolicitudPedidoPayload
  ): Promise<BorradorSolicitudPedidoResponse> {
    const ctx = contextoSolicitudPedidoFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const borradorRp = qr.manager.getRepository(SolicitudPedidoBorradorOrm);
      const sedeRp = qr.manager.getRepository(CentroOrm);

      if (!(await sedeRp.existsBy({ id: payload.sedeId }))) {
        throw new Error('No existe la sede enviada');
      }

      let borrador = await borradorRp.findOne({
        where: {
          usuarioId: this.auth.id,
          sedeId: payload.sedeId,
          contexto: payload.contextCode,
        },
      });

      const ahora = new Date();
      const payloadJson = JSON.stringify({
        porAgrupamiento: payload.porAgrupamiento ?? true,
        productos: payload.productos,
      });

      if (!borrador) {
        borrador = borradorRp.create({
          usuarioId: this.auth.id,
          sedeId: payload.sedeId,
          contexto: payload.contextCode,
          datosJson: payloadJson,
          fechaCreacion: ahora,
          fechaActualizacion: ahora,
        });
      } else {
        borrador.datosJson = payloadJson;
        borrador.fechaActualizacion = ahora;
      }

      await borradorRp.save(borrador);

      return {
        version: 1,
        sedeId: borrador.sedeId,
        contextCode: payload.contextCode,
        porAgrupamiento: payload.porAgrupamiento ?? true,
        productos: payload.productos,
        guardadoEn: ahora.toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Error al guardar el borrador: ${error.message}`);
    } finally {
      await qr.release();
    }
  }

  async eliminar(
    contextCode: GcmContextCode,
    sedeId?: number
  ): Promise<{ success: boolean }> {
    const ctx = contextoSolicitudPedidoFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const borradorRp = qr.manager.getRepository(SolicitudPedidoBorradorOrm);
      const where: any = {
        usuarioId: this.auth.id,
        contexto: contextCode,
      };
      if (sedeId) {
        where.sedeId = sedeId;
      }
      await borradorRp.delete(where);

      return { success: true };
    } catch (error: any) {
      throw new Error(`Error al eliminar el borrador: ${error.message}`);
    } finally {
      await qr.release();
    }
  }
}
