import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../../base';
import { orderBy } from 'lodash';
import { In } from 'typeorm';
import { OldAddOrdenToCotDto } from '@inn/central-compras/presentation/dtos';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DocumentoCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@orm/inn/central-compras';
import { ProductoOrm as AfnProductoOrm } from '@orm/inn/activos-fijos';
import { TIPOS, ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { consecutivosServices } from '@common/application/services';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@orm/inn/productos';
import { DetalleOrdenActivoOrm, DetalleOrdenCompraOrm, DocumentoOrm } from '@orm/inn/documentos';

@Injectable()
export class AddOrdenToCotizacionImpl extends CentralComprasSource {
  public async execute(payload: OldAddOrdenToCotDto) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.connect();
    try {
      await localQr.startTransaction();
      const detalleOrdenActivoRp = localQr.manager.getRepository(DetalleOrdenActivoOrm);
      const detalleOrdenRp = localQr.manager.getRepository(DetalleOrdenCompraOrm);
      const cambioEstadoRp = localQr.manager.getRepository(CambioEstadoOrm);
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const cotDocumentoRp = localQr.manager.getRepository(DocumentoCotizacionOrm);
      const documentoRp = localQr.manager.getRepository(DocumentoOrm);
      const pagoRp = localQr.manager.getRepository(PagoOrm);

      const cotizacion = await cotizacionRp.findOneOrFail({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      if (!cotizacion.proveedorId) {
        throw new Error(`La cotización aun no tiene un proveedor registrado`);
      }

      const itemsAprobados = cotizacion.detalle.filter(item => item.isAprobado === true);

      const solicitud = await solicitudRp.findOneOrFail({ where: { id: cotizacion.solicitudId } });

      const activosFijosIds: number[] = [];
      const productosIds: number[] = [];

      cotizacion.detalle.forEach(el => {
        if (el.item.productoId) {
          if (el.item.productoId) {
            if (el.item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
              activosFijosIds.push(el.item.productoId);
            } else {
              productosIds.push(el.item.productoId);
            }
          }
        }
      });

      const dimProductos: ProductoOrm[] = [];

      const activoFijoRp = localQr.manager.getRepository(AfnProductoOrm);
      const productoRp = localQr.manager.getRepository(ProductoOrm);

      const activosFijosFromBd = await activoFijoRp.find({ where: { id: In(activosFijosIds) } });
      const productosFromBd = await productoRp.find({ where: { id: In(productosIds) } });

      productosFromBd.map(el => {
        el.setTypes();
      });

      const prods = activosFijosFromBd.map(af => {
        const producto = new ProductoOrm();
        producto.id = af.id;
        producto.codigo = af.codigo;
        producto.descripcion = af.descripcion;
        producto.isBloqueado = false;
        producto.precioSugerido = af.precioSugerido;
        producto.clase = TIPOS.ACTIVO_FIJO as any;
        producto.claseCode = TIPOS.ACTIVO_FIJO.getCode() as any;
        producto.tipoCode = TIPOS.ACTIVO_FIJO.getCode() as any;
        return producto;
      });

      dimProductos.push(...productosFromBd);
      dimProductos.push(...prods);

      cotizacion.detalle.map(dt => {
        if (dt.item.productoId) {
          const af = dimProductos.filter(
            acf => acf.id === dt.item.productoId && acf.tipoCode === dt.item.tipoCode
          )[0];
          try {
            if (dt.item && dt.item.marca) af.marca = dt.item.marca;
          } catch (error) {}
          dt.item.producto = af;
        }
      });

      if (solicitud.wasRejected()) {
        throw new Error('Esta solicitud ya fue rechazada');
      }

      const kwTO = this.keyWordsTipoOrden(solicitud.tipoCode);

      payload.consecutivo = consecutivosServices.autocomplete(payload.consecutivo);

      const documento = await documentoRp.findOne({
        where: { consecutivo: payload.consecutivo, tipoCode: kwTO.tipoDocumento },
        relations: ['creadoPor'],
      });

      if (!documento) throw new Error(`No existe orden de ${kwTO.tipoOrden} con este consecutivo`);

      const cotizacionesWithSameDocumento = await cotizacionRp.find({
        where: { cotDocumentoId: documento.id },
      });

      if (cotizacionesWithSameDocumento.length) {
        throw new Error(`Hay una o mas cotizaciones con esta ${kwTO.tipoOrdenAbr}`);
      }

      const productos = await detalleOrdenRp.find({ where: { ordenId: documento.id } });
      const activosFijos = await detalleOrdenActivoRp.find({ where: { ordenId: documento.id } });

      productos.push(...(activosFijos as any));

      if (itemsAprobados.length !== productos.length) {
        throw new Error('La cantidad de productos en la OC no coincide con los de la cotización');
      }

      const pagosOrdenados = orderBy(payload.cuotas, 'noCuota', 'asc');

      let valorTotal = 0;

      cotizacion.detalle.forEach(el => {
        if (el.isAprobado) {
          const porcentajeConDescuento = 100 - el.descuento;
          const valorSubtotal = el.valorUnitario * el.item.cantidad;
          const valorReal = (valorSubtotal / 100) * porcentajeConDescuento;
          const valorConIVA = el.IVA ? valorReal + (valorReal / 100) * el.IVA : valorReal;
          valorTotal += valorConIVA;
        }
      });

      itemsAprobados.forEach(itemAprobado => {
        console.log(itemAprobado);
        let productoEnOC: DetalleOrdenCompraOrm[];

        if (kwTO.tipoDocumento === 0) {
          productoEnOC = productos.filter(pro => pro.productoId === itemAprobado.item.productoId);
        } else {
          productoEnOC = productos.filter(
            pro =>
              pro.cantidad === itemAprobado.item.cantidad &&
              pro.valorCOP - itemAprobado.valorUnitario <= 100 &&
              pro.valorCOP - itemAprobado.valorUnitario >= -100
          );
        }

        if (productoEnOC.length) {
          if (itemAprobado.item.cantidad !== productoEnOC[0].cantidad) {
            throw new Error(
              `La cantidad del item ${itemAprobado.item.descripcion} no es la misma en la ${kwTO.tipoOrdenAbr}`
            );
          }

          const diffPrecios = itemAprobado.valorUnitario - productoEnOC[0].valorCOP;

          if (diffPrecios < -100 || diffPrecios > 100) {
            throw new Error(
              `El precio del item ${itemAprobado.item.descripcion} no es el mismo en la ${kwTO.tipoOrdenAbr}`
            );
          }
        } else {
          if (kwTO.tipoDocumento === 0) {
            throw new Error(
              `El producto ${itemAprobado.item.descripcion} no existe en la ${kwTO.tipoOrdenAbr}`
            );
          } else {
            throw new Error(
              `Uno o mas servicios en la ${kwTO.tipoOrdenAbr} no coinciden en cantidad y/o precio unitario`
            );
          }
        }
      });

      const estado = await this.createCambioEstadoDeprecated(localQr, {
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.COTI_OC_AGREGADA.getCode(),
        estadoCode: ESTADOS.SOL_ULTIMOS_PASOS.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacion.id,
        informacionAdicional: `${kwTO.tipoOrdenAbr} ${documento.consecutivo} agregada a cot. #${cotizacion.id}`,
      });

      const newCotDocumento = new DocumentoCotizacionOrm();
      newCotDocumento.cotizacionId = cotizacion.id;
      newCotDocumento.documentoId = documento.id;
      newCotDocumento.estadoId = estado.id;
      newCotDocumento.tipoPagoCode = payload.tipoPago;
      const cotDocumentoStored = await cotDocumentoRp.save(newCotDocumento);

      const newPagos: PagoOrm[] = [];
      pagosOrdenados.forEach((el, i) => {
        const newPago = new PagoOrm();
        newPago.cotizacionId = cotizacion.id;
        newPago.cotDocumentoId = cotDocumentoStored.id;
        if (i === pagosOrdenados.length - 1) newPago.pagarAlFinTrabajo = el.alFinalizarTrabajo;
        else newPago.pagarAlFinTrabajo = false;
        newPago.porcentaje = el.porcentaje;
        newPago.diasPlazo = el.diasPlazo;
        newPago.valor = (valorTotal / 100) * el.porcentaje;
        newPago.fechaOrdenCompra = documento.fechaCreacion;
        newPagos.push(newPago);
      });

      const pagosStored = await pagoRp.save(newPagos);

      cotizacion.cotDocumentoId = cotDocumentoStored.id;
      cotizacion.recibida = null;
      await cotizacionRp.save(cotizacion);

      const rechazoPrevio = await cambioEstadoRp.findOne({
        where: {
          solicitudId: solicitud.id,
          entidadRelacionadaId: cotizacion.id,
          keyCode: In([
            ESTADOS_ESPECIFICOS.COTI_OC_NO_PROGRAMADA.getCode(),
            ESTADOS_ESPECIFICOS.COTI_OC_NO_APROBADA.getCode(),
          ]),
        },
      });

      if (rechazoPrevio) {
        rechazoPrevio.entidadRelacionadaId = null;
        await cambioEstadoRp.save(rechazoPrevio);
      }

      await localQr.commitTransaction();

      return { estado, documento, pagos: pagosStored };
    } catch (error) {
      await localQr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
