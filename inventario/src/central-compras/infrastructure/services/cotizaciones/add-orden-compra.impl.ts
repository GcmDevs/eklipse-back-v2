import { In } from 'typeorm';
import { orderBy } from 'lodash';
import { BadRequestException, Injectable } from '@nestjs/common';
import { gcmContextFactory } from '@common/domain/types';
import { CentralComprasSource } from '../base-source';
import { AddOCDto } from '@inn/central-compras/presentation/dtos/cotizaciones';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DocumentoCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@inn/orm/inn/central-compras';
import { DocumentoOrm } from '@inn/orm/inn/documentos';
import { DetalleOrdenActivoOrm, DetalleOrdenCompraOrm } from '@inn/orm/inn/documentos/orden-compra';
import {
  SOL_ESTADOS,
  SOL_ESTADOS_ESPECIFICOS,
  TIPOS,
} from '@inn/types/inn/central-compras/solicitudes';
import { ProductoOrm } from '@inn/orm/inn/productos';
import { ProductoOrm as AfnProductoOrm } from '@inn/orm/inn/activos-fijos';
import { consecutivosServices } from '@common/infrastructure/services';
import { TIPOS_DOCUMENTO } from '@inn/types/inn/documentos';

@Injectable()
export class AddOCImpl extends CentralComprasSource {
  public async execute(payload: AddOCDto) {
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));

    await qr.connect();
    try {
      await qr.startTransaction();

      // Repositorios
      const detalleOrdenActivoRp = qr.manager.getRepository(DetalleOrdenActivoOrm);
      const cotDocumentoRp = qr.manager.getRepository(DocumentoCotizacionOrm);
      const detalleOrdenRp = qr.manager.getRepository(DetalleOrdenCompraOrm);
      const cambioEstadoRp = qr.manager.getRepository(CambioEstadoOrm);
      const activoFijoRp = qr.manager.getRepository(AfnProductoOrm);
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const documentoRp = qr.manager.getRepository(DocumentoOrm);
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const pagoRp = qr.manager.getRepository(PagoOrm);

      // Autocompletar consecutivo
      payload.consecutivo = consecutivosServices.autocomplete(payload.consecutivo);

      // Obtener cotización
      const cotizacion = await cotizacionRp.findOne({
        where: { id: payload.cotizacionId },
        relations: ['detalle', 'detalle.item'],
      });

      // Validar que exista la cotización y que tenga proveedor
      if (!cotizacion) throw new Error(`No existe esta cotización`);
      if (!cotizacion.proveedorId) throw new Error(`La cotización no tiene proveedor registrado`);

      // Obtener solicitud y validar que no haya sido rechazada
      const solicitud = await solicitudRp.findOne({ where: { id: cotizacion.solicitudId } });
      if (solicitud.wasRejected()) throw new Error('Esta solicitud ya fue rechazada');

      // Generar keywords para validar el tipo de orden de compra según el tipo de solicitud
      const kwForOC = this.keyWordsTipoOrden(solicitud.tipoCode);

      // Obtener documento y validar que exista y que no haya otra cotización con el mismo documento
      const documento = await documentoRp.findOne({
        where: { consecutivo: payload.consecutivo, tipoCode: kwForOC.tipoDocumento },
        relations: ['creadoPor'],
      });
      if (!documento) throw new Error(`No existe ${kwForOC.tipoOrden} con este consecutivo`);
      const cotsWithSameDoc = await cotizacionRp.find({ where: { cotDocumentoId: documento.id } });
      if (cotsWithSameDoc.length) throw new Error(`Hay cots con esta ${kwForOC.tipoOrdenAbr}`);

      // Obtener productos de la orden de compra
      const allProds = await detalleOrdenRp.find({ where: { ordenId: documento.id } });
      const afnProds = await detalleOrdenActivoRp.find({ where: { ordenId: documento.id } });
      allProds.push(...(afnProds as any));

      // Validar items aprobados
      const itemsAprobados = cotizacion.detalle.filter(item => item.isAprobado === true);

      // Validar que la cantidad de items aprobados sea igual a la cantidad de productos en la oc
      const isSameCantItems = itemsAprobados.length === allProds.length;
      if (!isSameCantItems) throw new Error(`La cant. de prods no coincide`);

      // Traer productos de la cotización
      const afnProdsFromCotIds: number[] = [];
      const innProdsFromCotIds: number[] = [];
      cotizacion.detalle.forEach(el => {
        if (el.item.productoId) {
          const itemIsActivoFijo = el.item.tipoCode === TIPOS.ACTIVO_FIJO.getCode();
          if (itemIsActivoFijo) afnProdsFromCotIds.push(el.item.productoId);
          else innProdsFromCotIds.push(el.item.productoId);
        }
      });

      // Traer productos de dinamica requeridos en la cotización
      const prodsFromDim: ProductoOrm[] = [];
      const afnProdsFromBD = await activoFijoRp.find({ where: { id: In(afnProdsFromCotIds) } });
      const innProdsFromBD = await productoRp.find({ where: { id: In(innProdsFromCotIds) } });
      prodsFromDim.push(...innProdsFromBD);
      prodsFromDim.push(
        ...afnProdsFromBD.map(af => {
          const prod = new ProductoOrm();
          prod.id = af.id;
          prod.codigo = af.codigo;
          prod.descripcion = af.descripcion;
          prod.descripcionCorta = af.descripcion;
          prod.isBloqueado = false;
          prod.precioSugerido = af.precioSugerido;
          prod.clase = TIPOS.ACTIVO_FIJO as any;
          prod.claseCode = TIPOS.ACTIVO_FIJO.getCode() as any;
          prod.tipoCode = TIPOS.ACTIVO_FIJO.getCode() as any;
          return prod;
        })
      );

      // Mapear productos de dinamica a los items de la cotización
      cotizacion.detalle.map(dt => {
        if (dt.item) {
          if (dt.item.productoId) {
            const afnProd = prodsFromDim.find(
              acf => acf.id === dt.item.productoId && acf.tipoCode === dt.item.tipoCode
            );
            if (afnProd && dt.item.marca) afnProd.marca = dt.item.marca;
            dt.item.producto = afnProd;
          }
        }
      });

      // Proceso de creación de pagos
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

      // Verificación de coincidencia de los items de la OC vs items de cotización
      itemsAprobados.forEach(itemAprob => {
        let prodInOC: DetalleOrdenCompraOrm;
        const item = itemAprob.item;
        const nomItem = item.producto
          ? item.producto.descripcionCorta
          : (item.nombre ?? item.descripcion);
        const errExt = `en la ${kwForOC.tipoOrdenAbr}`;

        if (kwForOC.tipoDocumento === TIPOS_DOCUMENTO.ORDEN_COMPRA.getCode()) {
          prodInOC = allProds.find(pro => pro.productoId === item.productoId);
        } else {
          prodInOC = allProds.find(
            pro =>
              pro.cantidad === item.cantidad &&
              pro.valorCOP - itemAprob.valorUnitario <= 100 &&
              pro.valorCOP - itemAprob.valorUnitario >= -100 &&
              pro.porcDescuento === itemAprob.descuento &&
              pro.porcIVA === itemAprob.IVA
          );
          if (!prodInOC) throw new Error(`No existe item compatible con ${nomItem} ${errExt}`);
        }

        if (prodInOC) {
          const IVACoincide = prodInOC.porcIVA === itemAprob.IVA;
          const descCoincide = prodInOC.porcDescuento !== itemAprob.descuento;
          const cantCoincide = item.cantidad !== prodInOC.cantidad;
          const diffPrecios = itemAprob.valorUnitario - prodInOC.valorCOP;
          const diffIsSafe = diffPrecios > -100 || diffPrecios < 100;
          if (!IVACoincide) throw new Error(`El IVA de ${nomItem} no es el mismo ${errExt}`);
          if (descCoincide) throw new Error(`El descuento de ${nomItem} no es el mismo ${errExt}`);
          if (cantCoincide) throw new Error(`La cantidad de ${nomItem} no es la misma ${errExt}`);
          if (!diffIsSafe) throw new Error(`El precio de ${nomItem} no es el mismo ${errExt}`);
        } else {
          if (kwForOC.tipoDocumento === 0) {
            throw new Error(`El producto ${nomItem} no existe ${errExt}`);
          }
        }
      });

      // Crear cambio de estado y documento de cotización
      const estado = await this.createCambioEstado(qr, {
        solicitud,
        estado: SOL_ESTADOS.SOL_ULTIMOS_PASOS,
        entidadRelacionadaId: cotizacion.id,
        estadoEspecifico: SOL_ESTADOS_ESPECIFICOS.COTI_OC_AGREGADA,
        informacionAdicional: `${kwForOC.tipoOrdenAbr} ${documento.consecutivo} agregada a cot. #${cotizacion.id}`,
      });

      // Crear documento de cotización
      const newCotDoc = new DocumentoCotizacionOrm();
      newCotDoc.cotizacionId = cotizacion.id;
      newCotDoc.documentoId = documento.id;
      newCotDoc.estadoId = estado.id;
      newCotDoc.tipoPagoCode = payload.tipoPago;
      const cotDocStored = await cotDocumentoRp.save(newCotDoc);

      // Crear pagos
      const newPagos: PagoOrm[] = [];
      pagosOrdenados.forEach((el, i) => {
        const newPago = new PagoOrm();
        newPago.cotizacionId = cotizacion.id;
        newPago.cotDocumentoId = cotDocStored.id;
        if (i === pagosOrdenados.length - 1) newPago.pagarAlFinTrabajo = el.alFinalizarTrabajo;
        else newPago.pagarAlFinTrabajo = false;
        newPago.porcentaje = el.porcentaje;
        newPago.diasPlazo = el.diasPlazo;
        newPago.valor = (valorTotal / 100) * el.porcentaje;
        newPago.fechaOrdenCompra = documento.fechaCreacion;
        newPagos.push(newPago);
      });
      await pagoRp.save(newPagos);

      // Modificar cotización
      cotizacion.cotDocumentoId = cotDocStored.id;
      cotizacion.recibida = null;
      await cotizacionRp.save(cotizacion);

      // Desligar rechazo previo (si existe)
      const rechazoPrevio = await cambioEstadoRp.findOne({
        where: {
          solicitudId: solicitud.id,
          entidadRelacionadaId: cotizacion.id,
          keyCode: In([
            SOL_ESTADOS_ESPECIFICOS.COTI_OC_NO_PROGRAMADA.getCode(),
            SOL_ESTADOS_ESPECIFICOS.COTI_OC_NO_APROBADA.getCode(),
          ]),
        },
      });

      if (rechazoPrevio) {
        rechazoPrevio.entidadRelacionadaId = null;
        await cambioEstadoRp.save(rechazoPrevio);
      }

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
