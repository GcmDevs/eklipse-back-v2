import { Injectable } from '@nestjs/common';
import { In, Not, Repository } from 'typeorm';

import { GCM_CONTEXTS, GcmContextType, gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { CreateSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';
import {
  SolicitudPedidoHistorialOrm,
  SolicitudPedidoOrm,
  SolicitudPedidoProductoOrm,
} from '@inn/orm/inn/solicitud-pedido';
import {
  estadoProductosTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import { ProductoOrm } from '@inn/orm/inn/productos';
import { CentroOrm } from '@inn/orm/adn';

@Injectable()
export class CreateSolicitudPedidoImpl extends BaseSource {
  public async execute(body: CreateSolicitudPedidoPayload) {
    const ctx = gcmContextFactory(body.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction('SERIALIZABLE');

      if (!Number.isInteger(body.sedeId) || body.sedeId <= 0) {
        throw new Error('Debe enviar una sede valida');
      }
      if (!Array.isArray(body.productos) || body.productos.length === 0) {
        throw new Error('Debe enviar al menos un producto');
      }

      body.productos.forEach(producto => {
        if (!Number.isInteger(producto.productoId) || producto.productoId <= 0) {
          throw new Error('Todos los productos deben tener un productoId valido');
        }
        if (!Number.isFinite(producto.cantidad) || producto.cantidad <= 0) {
          throw new Error('Todos los productos deben tener una cantidad mayor a cero');
        }
        estadoProductosTypeFactory(producto.estadoCode);
      });

      const solicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);
      const solicitudPedidoHistRp = qr.manager.getRepository(SolicitudPedidoHistorialOrm);
      const solicitudPedidoProductoRp = qr.manager.getRepository(SolicitudPedidoProductoOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const sedeRp = qr.manager.getRepository(CentroOrm);

      const sedeExists = await sedeRp.existsBy({ id: body.sedeId });
      if (!sedeExists) throw new Error('No existe la sede enviada');

      const productoIds = [...new Set(body.productos.map(producto => producto.productoId))];
      const productosStored = await productoRp.findBy({ id: In(productoIds) });
      if (productosStored.length !== productoIds.length) {
        throw new Error('Uno o mas productos no existen');
      }

      await this._validarProductosPendientes(solicitudPedidoProductoRp, body.sedeId, productoIds);

      const hoy = new Date();

      const newSolicitudPedido = new SolicitudPedidoOrm();
      newSolicitudPedido.estadoCode = ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode();
      newSolicitudPedido.fechaCreacion = hoy;
      newSolicitudPedido.creadoPorId = this.auth.id;
      newSolicitudPedido.sedeId = body.sedeId;
      newSolicitudPedido.numeroSolicitud = await this._consecutivoSolicitudPedido(
        solicitudPedidoRp,
        ctx,
        body.sedeId
      );

      const solicitudPedidoStored = await solicitudPedidoRp.save(newSolicitudPedido);

      const productos = body.productos.map(producto =>
        solicitudPedidoProductoRp.create({
          solicitudPedidoId: solicitudPedidoStored.id,
          productoId: producto.productoId,
          estadoCode: producto.estadoCode,
          cantidad: producto.cantidad,
          cantidadEnviada: 0,
          estadoDespachoCode: ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode(),
        })
      );

      await solicitudPedidoProductoRp.save(productos);

      const historial = new SolicitudPedidoHistorialOrm();
      historial.solicitudPedidoId = solicitudPedidoStored.id;
      historial.estadoCode = ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode();
      historial.fechaCambio = hoy;
      historial.usuarioId = this.auth.id;

      historial.sedeId = body.sedeId;

      await solicitudPedidoHistRp.save(historial);

      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  private async _validarProductosPendientes(
    solicitudPedidoProductoRp: Repository<SolicitudPedidoProductoOrm>,
    sedeId: number,
    productoIds: number[]
  ): Promise<void> {
    const productosPendientes = await solicitudPedidoProductoRp.find({
      where: {
        productoId: In(productoIds),
        estadoDespachoCode: Not(ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode()),
        solicitudPedido: {
          sedeId,
        },
      },
      relations: ['solicitudPedido', 'producto'],
      order: {
        solicitudPedido: { fechaCreacion: 'ASC' },
        producto: { codigo: 'ASC' },
      },
    });

    if (productosPendientes.length === 0) return;

    const solicitudes = new Map<string, Set<string>>();

    productosPendientes.forEach(detalle => {
      const numeroSolicitud =
        detalle.solicitudPedido.numeroSolicitud || `#${detalle.solicitudPedido.id}`;
      const producto = `${detalle.producto.codigo} - ${detalle.producto.descripcionLarga}`;
      const productos = solicitudes.get(numeroSolicitud) ?? new Set<string>();

      productos.add(producto);
      solicitudes.set(numeroSolicitud, productos);
    });

    const detalleSolicitudes = [...solicitudes.entries()]
      .map(([numeroSolicitud, productos]) => `${numeroSolicitud}: ${[...productos].join(', ')}`)
      .join('; ');

    throw new Error(
      `Ya existen productos pendientes para esta sede en las siguientes solicitudes: ${detalleSolicitudes}`
    );
  }

  private async _consecutivoSolicitudPedido(
    solicitudPedidoRp: Repository<SolicitudPedidoOrm>,
    ctx: GcmContextType,
    sedeId: number
  ): Promise<string> {
    const prefijo = this._prefijoSolicitudPedido(ctx, sedeId);
    const cantidadDigitos = 10;
    const longitudConsecutivo = prefijo.length + cantidadDigitos;

    const ultimaSolicitud = await solicitudPedidoRp
      .createQueryBuilder('solicitud')
      .setLock('pessimistic_write')
      .where('solicitud.numeroSolicitud LIKE :prefijo', { prefijo: `${prefijo}%` })
      .andWhere('LEN(solicitud.numeroSolicitud) = :longitudConsecutivo', {
        longitudConsecutivo,
      })
      .orderBy('solicitud.numeroSolicitud', 'DESC')
      .getOne();

    const ultimoNumero = ultimaSolicitud
      ? Number(ultimaSolicitud.numeroSolicitud.slice(prefijo.length))
      : 0;
    const siguienteNumero = ultimoNumero + 1;

    if (!Number.isSafeInteger(siguienteNumero) || siguienteNumero > 9_999_999_999) {
      throw new Error(`Se alcanzo el limite de consecutivos para el prefijo ${prefijo}`);
    }

    return `${prefijo}${siguienteNumero.toString().padStart(cantidadDigitos, '0')}`;
  }

  private _prefijoSolicitudPedido(ctx: GcmContextType, sedeId: number): string {
    switch (ctx.getCode()) {
      case GCM_CONTEXTS.ALTACENTRO.getCode():
        if (sedeId === 1) return 'CM';
        if (sedeId === 2) return 'AC';
        if (sedeId === 3) return 'CPS';
        throw new Error('La sede no tiene un prefijo de solicitud configurado');
      case GCM_CONTEXTS.VALLEDUPAR.getCode():
        return 'VDP';
      case GCM_CONTEXTS.AGUACHICA.getCode():
        return 'AGU';
      case GCM_CONTEXTS.SANJUAN.getCode():
        return 'SJ';
      default:
        throw new Error('El contexto no tiene un prefijo de solicitud configurado');
    }
  }
}
