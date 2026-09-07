import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';

import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { CreateSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';
import {
  SolicitudPedidoHistorialOrm,
  SolicitudPedidoOrm,
  SolicitudPedidoProductoOrm,
  SolicitudPedidoSobrepedidoOrm,
  TipoCierreSobrepedido,
} from '@inn/orm/inn/solicitud-pedido';
import {
  estadoProductosTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import { ProductoOrm } from '@inn/orm/inn/productos';
import { CentroOrm } from '@inn/orm/adn';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';
import {
  buscarSolicitudesImpactadas,
  calcularCantidadPendienteProducto,
  construirImpactoSobrepedido,
  ImpactoSobrepedidoDesactualizadoError,
  ImpactoSobrepedidoResponse,
} from './sobrepedido-impacto';

const OBSERVACION_AUTOMATICA_SOBREPEDIDO =
  'Cierre automático por sobrepedido al reemplazar productos en una nueva solicitud.';

@Injectable()
export class CreateSolicitudPedidoImpl extends BaseSource {
  public async execute(body: CreateSolicitudPedidoPayload) {
    const ctx = contextoSolicitudPedidoFactory(body.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction('SERIALIZABLE');
      this._validarPayload(body);

      const solicitudRp = qr.manager.getRepository(SolicitudPedidoOrm);
      const historialRp = qr.manager.getRepository(SolicitudPedidoHistorialOrm);
      const productoSolicitudRp = qr.manager.getRepository(SolicitudPedidoProductoOrm);
      const sobrepedidoRp = qr.manager.getRepository(SolicitudPedidoSobrepedidoOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const sedeRp = qr.manager.getRepository(CentroOrm);

      if (!(await sedeRp.existsBy({ id: body.sedeId }))) {
        throw new Error('No existe la sede enviada');
      }

      const productoIds = body.productos.map(producto => producto.productoId);
      const productosStored = await productoRp.findBy({ id: In(productoIds) });
      if (productosStored.length !== productoIds.length) {
        throw new Error('Uno o más productos no existen');
      }

      const solicitudesImpactadas = await buscarSolicitudesImpactadas(
        solicitudRp,
        productoSolicitudRp,
        body.sedeId,
        productoIds,
        true
      );
      const impacto = construirImpactoSobrepedido(solicitudesImpactadas, productoIds);
      this._validarConfirmacionSobrepedido(body, impacto);
      const observacionSobrepedido = solicitudesImpactadas.length
        ? body.observacion?.trim() || OBSERVACION_AUTOMATICA_SOBREPEDIDO
        : body.observacion?.trim() || null;

      const ahora = new Date();
      const solicitudStored = await solicitudRp.save(
        solicitudRp.create({
          estadoCode: ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode(),
          fechaCreacion: ahora,
          creadoPorId: this.auth.id,
          sedeId: body.sedeId,
          numeroSolicitud: await this._consecutivoSolicitudPedido(solicitudRp, ctx, body.sedeId),
        })
      );

      const productosNuevos = await productoSolicitudRp.save(
        body.productos.map(producto =>
          productoSolicitudRp.create({
            solicitudPedidoId: solicitudStored.id,
            productoId: producto.productoId,
            estadoCode: producto.estadoCode,
            cantidad: this._redondearCantidad(producto.cantidad),
            cantidadEnviada: 0,
            cantidadRechazada: 0,
            cantidadSobrepedido: 0,
            estadoDespachoCode: ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode(),
          })
        )
      );

      const cierres = await this._cerrarSolicitudesSobrepedido(
        solicitudesImpactadas,
        solicitudStored,
        productosNuevos,
        observacionSobrepedido || '',
        ahora,
        solicitudRp,
        productoSolicitudRp,
        historialRp,
        sobrepedidoRp
      );

      await historialRp.save(
        historialRp.create({
          solicitudPedidoId: solicitudStored.id,
          estadoCode: ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode(),
          fechaCambio: ahora,
          usuarioId: this.auth.id,
          sedeId: body.sedeId,
          observacion: solicitudesImpactadas.length
            ? `Creada por sobrepedido de ${solicitudesImpactadas
                .map(solicitud => solicitud.numeroSolicitud)
                .join(', ')}. Motivo: ${observacionSobrepedido}`
            : observacionSobrepedido,
        })
      );

      await qr.commitTransaction();
      return {
        nuevaSolicitud: {
          id: solicitudStored.id,
          numeroSolicitud: solicitudStored.numeroSolicitud,
          contextCode: body.contextCode,
          sedeId: solicitudStored.sedeId,
          estadoCode: solicitudStored.estadoCode,
          fechaCreacion: solicitudStored.fechaCreacion,
        },
        solicitudesCerradas: solicitudesImpactadas.map(solicitud => ({
          id: solicitud.id,
          numeroSolicitud: solicitud.numeroSolicitud,
          estadoCode: ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode(),
        })),
        productosReemplazados: cierres.filter(cierre => cierre.tipoCierre === 'REEMPLAZADO'),
        productosCerradosSinTraslado: cierres.filter(
          cierre => cierre.tipoCierre === 'CERRADO_SIN_TRASLADO'
        ),
      };
    } catch (error: unknown) {
      if (qr.isTransactionActive) {
        try {
          await qr.rollbackTransaction();
        } catch {
          // SQL Server puede abortar la transacción antes del rollback. Se conserva el error real.
        }
      }
      if (error instanceof ImpactoSobrepedidoDesactualizadoError) throw error;
      if (error instanceof Error) throw error;
      throw new Error('No fue posible crear la solicitud');
    } finally {
      await qr.release();
    }
  }

  private _validarPayload(body: CreateSolicitudPedidoPayload): void {
    if (!Number.isInteger(body.sedeId) || body.sedeId <= 0) {
      throw new Error('Debe enviar una sede válida');
    }
    if (!Array.isArray(body.productos) || body.productos.length === 0) {
      throw new Error('Debe enviar al menos un producto');
    }
    body.productos.forEach(producto => {
      if (!Number.isInteger(producto.productoId) || producto.productoId <= 0) {
        throw new Error('Todos los productos deben tener un productoId válido');
      }
      if (!Number.isFinite(producto.cantidad) || producto.cantidad <= 0) {
        throw new Error('Todos los productos deben tener una cantidad mayor a cero');
      }
      estadoProductosTypeFactory(producto.estadoCode);
    });
    const productoIds = body.productos.map(producto => producto.productoId);
    if (new Set(productoIds).size !== productoIds.length) {
      throw new Error('No puede enviar el mismo producto más de una vez');
    }
  }

  private _validarConfirmacionSobrepedido(
    body: CreateSolicitudPedidoPayload,
    impacto: ImpactoSobrepedidoResponse
  ): void {
    if (!impacto.versionImpactoSobrepedido) {
      if (body.versionImpactoSobrepedido) {
        throw new ImpactoSobrepedidoDesactualizadoError(impacto);
      }
      return;
    }

    if (!body.confirmarSobrepedido) {
      throw new Error('Debe confirmar el cierre por sobrepedido');
    }
    if (body.versionImpactoSobrepedido !== impacto.versionImpactoSobrepedido) {
      throw new ImpactoSobrepedidoDesactualizadoError(impacto);
    }
  }

  private async _cerrarSolicitudesSobrepedido(
    solicitudes: SolicitudPedidoOrm[],
    nuevaSolicitud: SolicitudPedidoOrm,
    productosNuevos: SolicitudPedidoProductoOrm[],
    observacion: string,
    fecha: Date,
    solicitudRp: Repository<SolicitudPedidoOrm>,
    productoRp: Repository<SolicitudPedidoProductoOrm>,
    historialRp: Repository<SolicitudPedidoHistorialOrm>,
    sobrepedidoRp: Repository<SolicitudPedidoSobrepedidoOrm>
  ) {
    if (!solicitudes.length) return [];
    const nuevosPorProducto = new Map(
      productosNuevos.map(producto => [producto.productoId, producto])
    );
    const productosACerrar: SolicitudPedidoProductoOrm[] = [];
    const cierres: SolicitudPedidoSobrepedidoOrm[] = [];

    solicitudes.forEach(solicitud => {
      solicitud.productos.forEach(producto => {
        const cantidadPendiente = calcularCantidadPendienteProducto(producto);
        if (cantidadPendiente <= 0) return;

        const productoNuevo = nuevosPorProducto.get(producto.productoId);
        const tipoCierre: TipoCierreSobrepedido = productoNuevo
          ? 'REEMPLAZADO'
          : 'CERRADO_SIN_TRASLADO';
        producto.cantidadSobrepedido = cantidadPendiente;
        producto.estadoDespachoCode = ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode();
        producto.usuarioId = this.auth.id;
        productosACerrar.push(producto);
        cierres.push(
          sobrepedidoRp.create({
            solicitudAnteriorId: solicitud.id,
            productoAnteriorId: producto.id,
            solicitudNuevaId: nuevaSolicitud.id,
            productoNuevoId: productoNuevo?.id,
            tipoCierre,
            cantidadCerrada: cantidadPendiente,
            observacion,
            fechaCreacion: fecha,
            usuarioId: this.auth.id,
          })
        );
      });
      solicitud.estadoCode = ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode();
    });

    await productoRp.save(productosACerrar);
    await solicitudRp.save(solicitudes);
    const cierresStored = await sobrepedidoRp.save(cierres);
    await historialRp.save(
      solicitudes.map(solicitud => {
        const productos = cierres
          .filter(cierre => cierre.solicitudAnteriorId === solicitud.id)
          .map(cierre => {
            const producto = solicitud.productos.find(
              item => item.id === cierre.productoAnteriorId
            );
            return `${producto?.producto.codigo.trim()} (${Number(cierre.cantidadCerrada)})`;
          });
        return historialRp.create({
          solicitudPedidoId: solicitud.id,
          estadoCode: ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode(),
          fechaCambio: fecha,
          usuarioId: this.auth.id,
          sedeId: solicitud.sedeId,
          observacion: `Cerrada como SOBREPEDIDO al crear la solicitud ${nuevaSolicitud.numeroSolicitud}. Saldos cerrados: ${productos.join(', ')}. Motivo: ${observacion}`,
        });
      })
    );

    return cierresStored.map(cierre => {
      const solicitud = solicitudes.find(item => item.id === cierre.solicitudAnteriorId)!;
      const producto = solicitud.productos.find(item => item.id === cierre.productoAnteriorId)!;
      return {
        solicitudPedidoId: solicitud.id,
        numeroSolicitud: solicitud.numeroSolicitud,
        solicitudPedidoProductoId: producto.id,
        codigo: producto.producto.codigo,
        cantidadCerrada: Number(cierre.cantidadCerrada),
        tipoCierre: cierre.tipoCierre,
      };
    });
  }

  private _redondearCantidad(cantidad: number): number {
    return Number(cantidad.toFixed(4));
  }

  private async _consecutivoSolicitudPedido(
    solicitudPedidoRp: Repository<SolicitudPedidoOrm>,
    ctx: GcmContextType,
    sedeId: number
  ): Promise<string> {
    const prefijo = this._prefijoSolicitudPedido(ctx, sedeId);
    const longitudConsecutivo = prefijo.length + 10;
    const ultimaSolicitud = await solicitudPedidoRp
      .createQueryBuilder('solicitud')
      .setLock('pessimistic_write')
      .where('solicitud.numeroSolicitud LIKE :prefijo', { prefijo: `${prefijo}%` })
      .andWhere('LEN(solicitud.numeroSolicitud) = :longitudConsecutivo', {
        longitudConsecutivo,
      })
      .orderBy('solicitud.numeroSolicitud', 'DESC')
      .getOne();
    const siguienteNumero =
      (ultimaSolicitud ? Number(ultimaSolicitud.numeroSolicitud.slice(prefijo.length)) : 0) + 1;
    if (!Number.isSafeInteger(siguienteNumero) || siguienteNumero > 9_999_999_999) {
      throw new Error(`Se alcanzó el límite de consecutivos para el prefijo ${prefijo}`);
    }
    return `${prefijo}${siguienteNumero.toString().padStart(10, '0')}`;
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
