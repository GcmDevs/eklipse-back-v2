import { uniq } from 'lodash';
import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { CotizacionPrefabricadaBaseSource } from '../base';
import {
  CotizacionOrm,
  CotizacionPrefabricadaItemOrm,
  CotizacionPrefabricadaOrm,
  DetalleCotizacionOrm,
  DetalleSolicitudOrm,
  DocumentoCotizacionOrm,
  PagoOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import {
  PRIORIDADES,
  TIPOS,
  ESTADOS,
  ESTADOS_ESPECIFICOS,
} from '@inn/lgc/ctc/@types/inn/central-compras/solicitudes';
import {
  tipoPagoTypeFactory,
  TIPOS_PAGO,
} from '@inn/lgc/ctc/@types/inn/central-compras/cotizaciones';
import { CotiPrefaDto } from '@inn/lgc/ctc/presentation/dtos';
import { DocumentoOrm } from '@inn/lgc/ctc/orm/inn/documentos';
import { AlmacenOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { DetalleOrdenCompraOrm, OrdenCompraOrm } from '@inn/lgc/ctc/orm/inn/documentos';
import { ConsecutivoOrm } from '@inn/lgc/ctc/orm/gen';
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO } from '@inn/lgc/ctc/types/inn/documentos';
import { ItemCotizadoOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { consecutivosServices } from '@common/infrastructure/services';
import { castDataServices } from '@common/application/services';

@Injectable()
export class CotizacionPrefabricadaCrudSource extends CotizacionPrefabricadaBaseSource {
  public async fetch(): Promise<CotizacionPrefabricadaOrm[]> {
    const cotiPrefaRp = this.conn.getRepository(CotizacionPrefabricadaOrm);
    const data = await cotiPrefaRp.find({
      relations: ['proveedor', 'usuario', 'detalle', 'detalle.producto'],
    });

    data.map(d => {
      delete d.proveedorId;
      delete d.usuarioId;
      d.detalle.map(dt => {
        delete dt.cotizacionId;
        delete dt.cotizacionId;
        delete dt.productoId;
        delete dt.producto.agrupamientoId;
        delete dt.producto.grupoId;
        delete dt.producto.claseCode;
        delete dt.producto.tipoCode;
        delete dt.producto.riesgoCode;
        delete dt.producto.isBloqueado;
        delete dt.producto.marca;
        delete dt.producto.CUM;
        delete dt.producto.precioSugerido;
      });
    });
    return data;
  }

  public async create(body: CotiPrefaDto[]): Promise<CotizacionPrefabricadaOrm[]> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const cotiPrefaRp = this.qr.manager.getRepository(CotizacionPrefabricadaOrm);
      const cotiPrefaItemRp = this.qr.manager.getRepository(CotizacionPrefabricadaItemOrm);
      const itemCotizadoRp = this.qr.manager.getRepository(ItemCotizadoOrm);

      const productosIds: number[] = [];

      body.forEach(b => {
        b.detalle.forEach(d => {
          productosIds.push(d.productoId);
        });
      });

      await this.verifyProveedores(uniq(body.map(b => b.terceroId)));
      await this.verifyProductos(uniq(productosIds));

      const cotizacionesPrefabricadas: CotizacionPrefabricadaOrm[] = [];

      for (let i = 0; i < body.length; i++) {
        const el = body[i];

        const newCotiPrefa = new CotizacionPrefabricadaOrm();
        newCotiPrefa.createdAt = new Date();
        newCotiPrefa.proveedorId = el.terceroId;
        newCotiPrefa.usuarioId = this.auth.user.id;
        const cotiPrefaStored = await cotiPrefaRp.save(newCotiPrefa);

        const cotiPrefaItems: CotizacionPrefabricadaItemOrm[] = [];

        const itemsCotizados = await itemCotizadoRp.find({
          where: {
            proveedorId: el.terceroId,
          },
          relations: ['producto', 'valor'],
        });

        el.detalle.forEach(d => {
          const itemCotizadoFt = itemsCotizados.filter(ic => ic.productoId === d.productoId);
          const itemCotizado = itemCotizadoFt.length ? itemCotizadoFt[0] : undefined!;
          const newCotiPrefaItem = new CotizacionPrefabricadaItemOrm();
          newCotiPrefaItem.cotizacionId = cotiPrefaStored.id;
          newCotiPrefaItem.productoId = d.productoId;
          newCotiPrefaItem.cantidad = d.cantidad;
          d.producto = itemCotizado.producto;
          d.valor = itemCotizado ? itemCotizado.valor.valor : 0;
          d.IVA = itemCotizado ? itemCotizado.valor.IVA : 0;
          newCotiPrefaItem.valor = d.valor;
          newCotiPrefaItem.IVA = d.IVA;
          cotiPrefaItems.push(newCotiPrefaItem);
        });

        const docAndOCStored = await this._createOrdenCompra(el);

        cotiPrefaStored.documentoId = docAndOCStored.documento.id;
        await cotiPrefaRp.save(cotiPrefaStored);

        const cotiPrefaItemsStored = await cotiPrefaItemRp.save(cotiPrefaItems);
        newCotiPrefa.detalle = cotiPrefaItemsStored;
        cotizacionesPrefabricadas.push(newCotiPrefa);
        el.cotizacionPrefabricada = newCotiPrefa;
      }

      await this._createSolicitud(body);

      await this.qr.commitTransaction();

      return cotizacionesPrefabricadas;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  private async _createOrdenCompra(payload: CotiPrefaDto) {
    try {
      const detOrdenCompraRp = this.qr.manager.getRepository(DetalleOrdenCompraOrm);
      const consecutivoRp = this.qr.manager.getRepository(ConsecutivoOrm);
      const ordenCompraRp = this.qr.manager.getRepository(OrdenCompraOrm);
      const documentoRp = this.qr.manager.getRepository(DocumentoOrm);
      const almacenRp = this.qr.manager.getRepository(AlmacenOrm);

      let almacenConcatenado = '';
      let almacen: AlmacenOrm;

      if (payload.almacenId) {
        almacen = await almacenRp.findOne({ where: { id: payload.almacenId } });
        if (!almacen) throw new Error(`No existe almacen con el id ${payload.almacenId}`);
        almacenConcatenado = `${almacen.codigo}`;
      }

      let consecutivo = await consecutivoRp.findOne({
        where: {
          nombre: In([
            `IN-Orden_Compra${almacenConcatenado}`,
            `IN-Orden_Compra-AL${almacenConcatenado}`,
          ]),
        },
      });

      const isAMMedical = this.auth.context === GCM_CONTEXTS.AMMEDICAL;

      if (!consecutivo || isAMMedical) {
        consecutivo = await consecutivoRp.findOne({
          where: {
            nombre: In([`IN-Orden_Compra`]),
          },
        });
      }

      if (!consecutivo) throw new Error('No existe consecutivo correspondiente');

      consecutivo.numero = consecutivo.numero + 1;
      await consecutivoRp.save(consecutivo);

      const consecutivoGenerado = consecutivosServices.generate(
        `${isAMMedical ? 'OC' : almacen ? almacen.prefijo + 'OC' : 'OC'}`,
        consecutivo.numero
      );

      const newDocumento = new DocumentoOrm();
      newDocumento.consecutivo = consecutivoGenerado;
      newDocumento.fecha = new Date();
      newDocumento.tipoCode = TIPOS_DOCUMENTO.ORDEN_COMPRA.getCode();
      newDocumento.estadoCode = ESTADOS_DOCUMENTO.REGISTRADO.getCode();
      newDocumento.creadoPorId = this.auth.user.id;
      newDocumento.fechaCreacion = new Date();
      newDocumento.optimisticLockField = 0;
      newDocumento.objectType = this._setObjectType(this.auth.context);
      newDocumento.unknownValue = 0;

      const documentoStored = await documentoRp.save(newDocumento);

      const tipoPago = tipoPagoTypeFactory(payload.tipoPagoCode) || TIPOS_PAGO.A_CREDITO;

      await this.qr.query(`INSERT INTO INNCORDEN (OID) VALUES (${documentoStored.id})`);

      const ordenCompra = await ordenCompraRp.findOne({ where: { id: documentoStored.id } });
      ordenCompra.claseCode = 0; // ORDEN_COMPRA
      ordenCompra.estadoCode = 0; //SIN MOVIMIENTO
      ordenCompra.tipoMonedaCode = 0; //EXTRANJERA
      ordenCompra.tasaCambio = 0; //TASA DE CAMBIO
      ordenCompra.origenCode = 0; //ORDEN SIMPLE
      ordenCompra.tipoServicioCode = 0; //HONORARIOS
      ordenCompra.modalidadCode = 0; //NACIONAL
      ordenCompra.tipoNegociacionCode = 0; //SECRETARIA DISTRITAL
      ordenCompra.procesoCompraCode = 0; //DIRECTA
      ordenCompra.isForTalentoHumano = false;
      ordenCompra.isConsecutivoTalentoHumano = false;
      ordenCompra.isAdicion = false;
      ordenCompra.adicionNumero = '';
      ordenCompra.isLegalizado = false;
      ordenCompra.isDesdePlano = false;
      ordenCompra.areaDependencia = 1;
      ordenCompra.isExclusividad = false;
      ordenCompra.isGarantiaUnica = false;
      ordenCompra.tipoICOContratoCode = 0;
      ordenCompra.tipoCPNContratoCode = null;
      ordenCompra.valorNetoEXT = 0;
      ordenCompra.valorDescuentoEXT = 0;
      ordenCompra.valorImpuestosEXT = 0;
      ordenCompra.valorTotalEXT = 0;
      ordenCompra.fechaCumplimiento = null;
      ordenCompra.ICODetalle = payload.justificacion;
      ordenCompra.contrato = null;
      ordenCompra.fechaEntrega = null;
      ordenCompra.lugarEntrega = 'Calle 13B bis #17-54 B. Alfonso Lopez';
      ordenCompra.formaPago = castDataServices.capitalizeFirstLetter(tipoPago.getForHumans());
      ordenCompra.formaEntrega = 'Completa';
      ordenCompra.almacenId = payload.almacenId;
      ordenCompra.proveedorId = payload.terceroId;

      ordenCompra.valorNetoCOP = 0;
      ordenCompra.valorDescuentoCOP = 0;
      ordenCompra.valorImpuestosCOP = 0;
      ordenCompra.valorTotalCOP = 0;

      const itemsOrdenCompra: DetalleOrdenCompraOrm[] = [];

      payload.detalle.forEach(p => {
        const valorTotal = p.valor * p.cantidad;
        ordenCompra.valorNetoCOP += valorTotal;
        ordenCompra.valorImpuestosCOP += (valorTotal / 100) * p.IVA;
        ordenCompra.valorTotalCOP = ordenCompra.valorNetoCOP + ordenCompra.valorImpuestosCOP;

        const newItemOrdenCompra = new DetalleOrdenCompraOrm();
        newItemOrdenCompra.itemId = 1;
        newItemOrdenCompra.productoId = p.productoId;
        newItemOrdenCompra.cantidad = p.cantidad;
        newItemOrdenCompra.ordenId = ordenCompra.id;
        newItemOrdenCompra.valorUnidad = p.valor;
        newItemOrdenCompra.valorCOP = p.valor;
        newItemOrdenCompra.valorEXT = 0;
        newItemOrdenCompra.porcDescuento = 0;
        newItemOrdenCompra.porcIVA = p.IVA;
        newItemOrdenCompra.cantidadPendiente = p.cantidad;
        newItemOrdenCompra.cantidadCancelada = 0;
        newItemOrdenCompra.detalle = null;
        newItemOrdenCompra.isImportado = false;
        newItemOrdenCompra.optimisticLockField = 0;
        itemsOrdenCompra.push(newItemOrdenCompra);
      });

      const OCStored = await ordenCompraRp.save(ordenCompra);
      const itemsOCStored = await detOrdenCompraRp.save(itemsOrdenCompra);

      OCStored.detalle = itemsOCStored;

      return {
        documento: documentoStored,
        ordenCompra: OCStored,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async _createSolicitud(body: CotiPrefaDto[]) {
    try {
      const now = new Date();
      const detalleCotizacionRp = this.qr.manager.getRepository(DetalleCotizacionOrm);
      const itemSolicitudRp = this.qr.manager.getRepository(DetalleSolicitudOrm);
      const docCotRp = this.qr.manager.getRepository(DocumentoCotizacionOrm);
      const pagoRp = this.qr.manager.getRepository(PagoOrm);
      const cotizacionRp = this.qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);

      const newSolicitud = new SolicitudOrm();
      newSolicitud.prioridadCode = PRIORIDADES.CRITICA.getCode();
      newSolicitud.tipoCode = TIPOS.MEDICAMENTOS.getCode();
      newSolicitud.estadoCode = ESTADOS.COTI_POR_APROBAR.getCode();
      newSolicitud.centroId = 1; // AMMEDICAL
      newSolicitud.dependenciaId = 1; // USO INTERNO
      newSolicitud.dependenciaDestinoId = 1; // USO INTERNO
      newSolicitud.justificacion = `SOLICITUD DE MEDICAMENTOS (${
        now.getMonth() + 1
      }/${now.getFullYear()}) REALIZADA POR ${this.auth.user.fullName}`;
      newSolicitud.isCotizacionUnica = true;
      newSolicitud.isFinished = false;
      newSolicitud.usuarioId = this.auth.user.id;
      newSolicitud.createdAt = new Date();

      const solicitudStored = await solicitudRp.save(newSolicitud);

      this.createCambioEstado({
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_APROBADA.getCode(),
        estadoCode: ESTADOS.SOL_APROBADA.getCode(),
        solicitud: solicitudStored,
        cedulaUsuario: '56097793', // GABRIELA MALDONADO
        informacionAdicional: 'GENERADA AUTOMATICAMENTE',
      });

      solicitudStored.cotizaciones = [];

      const items: DetalleSolicitudOrm[] = [];

      body.forEach(b => {
        b.detalle.forEach(d => {
          const newItem = new DetalleSolicitudOrm();
          newItem.solicitudId = solicitudStored.id;
          newItem.productoId = d.productoId;
          newItem.marca = d.producto.marca;
          newItem.cantidad = d.cantidad;
          newItem.tipoCode = TIPOS.MEDICAMENTOS.getCode();
          newItem.isDeleted = false;
          items.push(newItem);
        });
      });

      const itemSoliStored = await itemSolicitudRp.save(items);

      for (let i = 0; i < body.length; i++) {
        const el = body[i].cotizacionPrefabricada;

        const tipoPago = tipoPagoTypeFactory(body[i].tipoPagoCode) || TIPOS_PAGO.A_CREDITO;

        const newCotizacion = new CotizacionOrm();
        newCotizacion.solicitudId = newSolicitud.id;
        newCotizacion.proveedorId = el.proveedorId;
        newCotizacion.isActiva = true;
        newCotizacion.requiereUnicaContabilizacion = true;
        if (tipoPago === TIPOS_PAGO.A_CREDITO) {
          newCotizacion.contabilizada = true;
          newCotizacion.pagada = true;
          newCotizacion.listaParaEntrega = true;
          newCotizacion.recibida = true;
        }
        const cotizacionStored = await cotizacionRp.save(newCotizacion);

        let valorTotal = 0;

        const newDocCot = new DocumentoCotizacionOrm();
        newDocCot.cotizacionId = cotizacionStored.id;
        newDocCot.documentoId = el.documentoId;
        newDocCot.tipoPagoCode = tipoPago.getCode() || 2;
        newDocCot.estadoId = null;
        const docCotStored = await docCotRp.save(newDocCot);

        cotizacionStored.cotDocumentoId = docCotStored.id;
        await cotizacionRp.save(cotizacionStored);

        const itemsCotizacion: DetalleCotizacionOrm[] = [];

        for (let index = 0; index < el.detalle.length; index++) {
          const det = el.detalle[index];
          const itemFromSoli = itemSoliStored.filter(i => i.productoId === det.productoId)[0];
          const newItemCotizacion = new DetalleCotizacionOrm();
          newItemCotizacion.solicitudId = solicitudStored.id;
          newItemCotizacion.cotizacionId = cotizacionStored.id;
          newItemCotizacion.itemId = itemFromSoli.id;
          newItemCotizacion.valorUnitario = det.valor;
          newItemCotizacion.IVA = det.IVA;
          newItemCotizacion.descuento = 0;
          newItemCotizacion.isAprobado = true;
          itemsCotizacion.push(newItemCotizacion);
          if (tipoPago !== TIPOS_PAGO.A_CREDITO) {
            const valTot = det.valor * det.cantidad;
            valorTotal += valTot + (valTot / 100) * det.IVA;
          }
        }

        let pagoStored: PagoOrm;

        if (tipoPago !== TIPOS_PAGO.A_CREDITO) {
          const newPago = new PagoOrm();
          newPago.cotizacionId = newCotizacion.id;
          newPago.cotDocumentoId = newDocCot.id;
          newPago.porcentaje = 100;
          newPago.valor = valorTotal;
          newPago.pagarAlFinTrabajo = false;
          newPago.diasPlazo = 7;
          newPago.fechaOrdenCompra = new Date();
          pagoStored = await pagoRp.save(newPago);
        }

        const itemsCotizacionStored = await detalleCotizacionRp.save(itemsCotizacion);
        cotizacionStored.detalle = itemsCotizacionStored;
        cotizacionStored.pagos = [pagoStored];

        solicitudStored.detalle = items;
        solicitudStored.cotizaciones.push(cotizacionStored);
      }

      return solicitudStored;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private _setObjectType(context: GcmContextType) {
    switch (context) {
      case GCM_CONTEXTS.ALTACENTRO:
        return 1300;
      case GCM_CONTEXTS.AGUACHICA:
        return 803;
      case GCM_CONTEXTS.AMMEDICAL:
        return 1487;
      case GCM_CONTEXTS.SANJUAN:
        return 1308;
    }
  }
}
