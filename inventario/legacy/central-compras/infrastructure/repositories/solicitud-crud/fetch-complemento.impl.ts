import { In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ProductoOrm as AfnProductoOrm } from '@inn/lgc/ctc/orm/inn/activos-fijos';
import {
  CambioEstadoOrm,
  DetalleCotizacionOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import {
  TIPOS,
  ESTADOS,
  ESTADOS_ESPECIFICOS,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CentralComprasSource } from '@inn/lgc/ctc/infrastructure/base';
import { solicitudOrmToComplementoSolicitudRes } from '../../factories';
import { claseProductoTypeFactory } from '@inn/lgc/ctc/types/inn/productos';
import { gcmContextFactory, GcmContexts } from '@common/domain/types';
import { ProductoOrm } from '@inn/lgc/ctc/orm/inn/productos';
import { cloneDeep, uniq } from 'lodash';
import { TIPOS_PAGO } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { consecutivosServices } from '@common/infrastructure/services';
import { ENVIRONMENTS } from '@inn/app.environments';
import { CTC_FILE_LOCATIONS } from '@inn/lgc/ctc/application/constants';

@Injectable()
export class FetchComplementoSolicitudImpl extends CentralComprasSource {
  async execute(id: number, ctx: GcmContexts) {
    const tempConn = this.dynamicQR(gcmContextFactory(ctx));
    const solicitudRp = tempConn.manager.getRepository(SolicitudOrm);
    const activoFijoRp = tempConn.manager.getRepository(AfnProductoOrm);
    const productoRp = tempConn.manager.getRepository(ProductoOrm);

    const solicitud = await solicitudRp.findOne({
      where: { id },
      relations: [
        'usuario',
        'dependencia',
        'dependenciaDestino',
        'centro',
        'detalle',
        'cotizaciones',
        'cotizaciones.proveedor',
        'cotizaciones.pagos',
        'cotizaciones.pagos.estadoAlProgramar',
        'cotizaciones.pagos.estadoAlProgramar.usuario',
        'cotizaciones.pagos.estadoAlPagar',
        'cotizaciones.pagos.estadoAlPagar.usuario',
        'cotizaciones.cotDocumento',
        'cotizaciones.cotDocumento.documento',
        'cotizaciones.cotDocumento.documento.creadoPor',
        'cotizaciones.detalle',
        'cotizaciones.detalle.item',
        'cotizaciones.cuentasxPagar',
        'cambiosEstado',
        'cambiosEstado.usuario',
      ],
    });

    let activosFijosIds: number[] = [];
    let productosIds: number[] = [];

    solicitud.detalle.forEach(dt => {
      if (dt.productoId) {
        if (dt.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
          activosFijosIds.push(dt.productoId);
        } else {
          productosIds.push(dt.productoId);
        }
      }
    });

    solicitud.detalle = solicitud.detalle.filter(d => !d.isDeleted);

    solicitud.cotizaciones.map(c => {
      const detCotValid: DetalleCotizacionOrm[] = [];
      c.detalle.map(d => {
        if (!d.item.isDeleted) detCotValid.push(d);
      });
      c.detalle = detCotValid;
    });

    const cotiElimiIds = solicitud.cotizaciones
      .filter(c => !c.detalle.length || c.isActiva === false)
      .map(c => c.id);

    if (cotiElimiIds.length) {
      solicitud.cambiosEstado = solicitud.cambiosEstado.filter(
        ce => cotiElimiIds.indexOf(ce.entidadRelacionadaId) < 0
      );
    }

    solicitud.cotizaciones = solicitud.cotizaciones.filter(
      c => c.detalle.length && c.isActiva !== false
    );

    activosFijosIds = uniq(activosFijosIds);
    productosIds = uniq(productosIds);

    const activosFijosFromBd = await activoFijoRp.find({ where: { id: In(activosFijosIds) } });
    const productosFromBd = await productoRp.find({ where: { id: In(productosIds) } });

    solicitud.detalle = solicitud.detalle.filter(dt => !dt.isDeleted);

    solicitud.detalle.map(dt => {
      if (dt.productoId) {
        if (dt.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
          const af = activosFijosFromBd.filter(
            acf => acf.id === dt.productoId && acf.clase === TIPOS.ACTIVO_FIJO
          )[0];
          dt.producto = new ProductoOrm();
          dt.producto.id = af.id;
          dt.producto.codigo = af.codigo;
          dt.producto.descripcion = af.descripcion;
          dt.producto.isBloqueado = false;
          dt.producto.marca = dt.marca;
          dt.producto.precioSugerido = af.precioSugerido;
          dt.producto.clase = TIPOS.ACTIVO_FIJO as any;
          dt.producto.claseCode = TIPOS.ACTIVO_FIJO.getCode() as any;
        } else {
          const af = productosFromBd.filter(
            acf => acf.id === dt.productoId && acf.clase !== TIPOS.ACTIVO_FIJO
          )[0];
          af.setTypes();
          dt.producto = af;
        }
      } else {
        if (dt.descripcion && dt.descripcion.includes('DESC.:')) {
          dt.informacionAdicional = dt.descripcion.split(`DESC.:`)[1];
        }
        if (dt.nombre && dt.descripcion) dt.informacionAdicional = dt.descripcion;
      }
      dt.setTypes();
    });
    solicitud.cotizaciones.map(ct => {
      ct.detalle.map(ctdt => {
        if (ctdt.item.productoId) {
          if (ctdt.item.tipoCode === TIPOS.ACTIVO_FIJO.getCode()) {
            const af = activosFijosFromBd.filter(
              acf => acf.id === ctdt.item.productoId && acf.clase === TIPOS.ACTIVO_FIJO
            )[0];
            ctdt.item.producto = new ProductoOrm();
            ctdt.item.producto.id = af.id;
            ctdt.item.producto.codigo = af.codigo;
            ctdt.item.producto.descripcion = af.descripcion;
            ctdt.item.producto.isBloqueado = false;
            ctdt.item.producto.marca = ctdt.item.marca;
            ctdt.item.producto.precioSugerido = af.precioSugerido;
            ctdt.item.producto.clase = TIPOS.ACTIVO_FIJO as any;
            ctdt.item.producto.claseCode = TIPOS.ACTIVO_FIJO.getCode() as any;
          } else {
            const af = productosFromBd.filter(
              acf => acf.id === ctdt.item.productoId && acf.clase !== TIPOS.ACTIVO_FIJO
            )[0];
            af.setTypes();
            if (!af.clase) {
              af.clase = claseProductoTypeFactory(solicitud.tipoCode === 1 ? 0 : 1);
            }
            ctdt.item.producto = af;
          }
        } else {
          if (ctdt.item.descripcion && ctdt.item.descripcion.includes('DESC.:')) {
            ctdt.item.informacionAdicional = ctdt.item.descripcion.split(`DESC.:`)[1];
          }

          if (ctdt.item.descripcion && ctdt.item.nombre) {
            ctdt.item.informacionAdicional = ctdt.item.descripcion;
          }
        }
        ctdt.item.setTypes();
      });
      if (solicitud.tipoCode === TIPOS.MEDICAMENTOS.getCode()) {
        solicitud.detalle.forEach(std => {
          const exist = ct.detalle.filter(ctd => ctd.itemId === std.id);
          if (!exist.length) {
            const newDetCot = new DetalleCotizacionOrm();
            newDetCot.solicitudId = solicitud.id;
            newDetCot.cotizacionId = ct.id;
            newDetCot.itemId = std.id;
            newDetCot.item = std;
            newDetCot.valorUnitario = 0;
            newDetCot.IVA = 0;
            newDetCot.descuento = 0;
            newDetCot.isAprobado = false;
            ct.detalle.push(newDetCot);
          }
        });
      }
    });

    await tempConn.release();

    solicitud.setTypes();
    solicitud.keyForTables = consecutivosServices.idWithContext(
      solicitud.id,
      gcmContextFactory(ctx),
      solicitud.centro.id
    );

    const createdState = new CambioEstadoOrm();
    createdState.createdAt = solicitud.createdAt;
    createdState.keyCode = ESTADOS_ESPECIFICOS.SOL_REGISTRADA.getCode();
    createdState.tipoCode = ESTADOS.SOL_REGISTRADA.getCode();
    createdState.usuario = solicitud.usuario;
    createdState.informacionAdicional = solicitud.justificacion.trim().toUpperCase();
    createdState.id = 1;
    solicitud.cambiosEstado.unshift(createdState);

    solicitud.cambiosEstado.map(ce => {
      ce.setTypes();
      if (ce.tipo === ESTADOS.COTI_POR_APROBAR) {
        ce.informacionAdicional = `Items aprobados para compra`;
      }
      if (ce.tipo === ESTADOS.SOL_EN_COTI && !ce.informacionAdicional) {
        ce.informacionAdicional = `COT. #${ce.entidadRelacionadaId}${
          solicitud.isCotizacionUnica ? ' (UNICA)' : ''
        } AGREGADA`;
      }
      if (ce.tipo === ESTADOS.COTI_APROBADA) {
        ce.informacionAdicional = `Aprob. #${ce.informacionAdicional}`;
      }
      if (ce.key === ESTADOS_ESPECIFICOS.COTI_LISTA_PARA_ENTREGA) {
        ce.informacionAdicional = `OC DE COT. #${ce.entidadRelacionadaId} LISTA PARA ENTREGA${
          ce.informacionAdicional ? `. ${ce.informacionAdicional}` : ''
        }`;
      }

      if (ce.key === ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA) {
        ce.archivoRelacionado = `${ENVIRONMENTS.apiUrl}/${CTC_FILE_LOCATIONS.cotizaciones}/${ce.archivoRelacionado}`;
      }
    });

    solicitud.centro.contexto = ctx;
    solicitud.authInSameContext = solicitud.centro.contexto === this.auth.context.getCode();

    const baseUrlFiles = `${ENVIRONMENTS.apiUrl}/${CTC_FILE_LOCATIONS.itemsSolicitud}`;

    solicitud.detalle.map(dt => {
      if (dt.fichaTecnica) dt.fichaTecnica = `${baseUrlFiles}/${dt.fichaTecnica}`;
      if (dt.formatoInclusion) dt.formatoInclusion = `${baseUrlFiles}/${dt.formatoInclusion}`;
      if (!dt.producto) dt.producto = this.createFakeProducto(dt.nombre);
      else dt.descripcion = dt.producto.descripcion;
    });

    solicitud.cotizaciones.map(ct => {
      ct.detalle.map(dt => {
        if (!dt.item.producto) dt.item.producto = this.createFakeProducto(dt.item.descripcion);
        else dt.item.descripcion = dt.item.producto.descripcion;
      });

      if (ct.cotDocumentoId) {
        ct.documento = ct.cotDocumento.documento;
        ct.documentoId = ct.cotDocumento.documentoId;
        ct.tipoPagoCode = ct.cotDocumento.tipoPagoCode;
      }

      if (ct.tipoPagoCode === TIPOS_PAGO.A_CREDITO.getCode() && ct.pagos) {
        const pu = cloneDeep(ct.pagos[0]);
        pu.id = 0;
        pu.porcentaje = 0;
        pu.valor = 0;
        pu.valorDescuento = 0;
        pu.pagarAlFinTrabajo = false;

        ct.pagos.forEach(pg => {
          pu.porcentaje += pg.porcentaje;
          pu.valor += pg.valor;
          pu.valorDescuento += pg.valorDescuento;
        });

        ct.pagos = [pu];
      }

      if (ct.tipoPagoCode === TIPOS_PAGO.CREDIANTICIPO.getCode() && ct.pagos) {
        const pu = cloneDeep(ct.pagos[1]);
        pu.id = ct.pagos[0].id + Math.floor(Math.random() * (9999999 - 1000000 + 1) + 1000000);
        pu.porcentaje = 0;
        pu.valor = 0;
        pu.valorDescuento = 0;
        pu.pagarAlFinTrabajo = false;

        ct.pagos.slice(1).forEach(pg => {
          pu.porcentaje += pg.porcentaje;
          pu.valor += pg.valor;
          pu.valorDescuento += pg.valorDescuento;
        });

        ct.pagos = [ct.pagos[0], pu];
      }

      if (!ct.proveedor) {
        const estadoCot = solicitud.cambiosEstado.filter(
          ce =>
            ce.entidadRelacionadaId === ct.id &&
            ce.tipo.getCode() == ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA.getCode()
        );

        ct.proveedor = this.createFakeProveedor(estadoCot[0].informacionAdicional);
      }
    });

    return solicitudOrmToComplementoSolicitudRes(solicitud);
  }
}
