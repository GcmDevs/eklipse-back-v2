import { Between } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GCM_CONTEXTS } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { ControlGastoHistorialOrm, ControlGastoOrm } from '@orm/inn/farmacia/control-gastos';
import { ENVIRONMENTS } from 'src/app.environments';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import { orderBy } from 'lodash';
import { IngresoOrm } from '@orm/gen';
import { INN_AUTHORITIES } from '@authorities/inventario';

@Injectable()
export class FetchControlGastoImpl extends BaseSource {
  public async execute(fechaInicio: Date, fechaFin: Date) {
    const showAllContext = await this.hasAnyAuthority([
      INN_AUTHORITIES.FARMACIA.CONTROL_GASTOS_FACTURADOR,
    ]);
    const ctxs = showAllContext
      ? [
          GCM_CONTEXTS.ALTACENTRO,
          GCM_CONTEXTS.VALLEDUPAR,
          GCM_CONTEXTS.SANJUAN,
          GCM_CONTEXTS.AGUACHICA,
        ]
      : [this.auth.context];

    const controlGastos: ControlGastoOrm[] = [];

    for (let index = 0; index < ctxs.length; index++) {
      const el = ctxs[index];
      const qr = this.dynamicQR(el);
      try {
        await qr.connect();

        const controlGastoRp = qr.manager.getRepository(ControlGastoOrm);
        const historialRp = qr.manager.getRepository(ControlGastoHistorialOrm);
        const ingresoRp = qr.manager.getRepository(IngresoOrm);

        const controlGastosTemp = await controlGastoRp.find({
          where: { fechaCreacion: Between(fechaInicio, fechaFin) },
          relations: [
            'creadoPor',
            'detalle',
            'detalle.item',
            'detalle.item.producto',
            'detalle.item.lote',
            'ordenDespacho',
            'ordenDespacho.dependencia',
            'ordenDespacho.documento',
            'sede',
            'trasladoProducto',
            'trasladoProducto.documento',
            'trasladoProducto.trasladoProductoDetalle',
            'trasladoProducto.trasladoProductoDetalle.producto',
            'trasladoProducto.trasladoProductoDetalle.remisionDetalle',
            'trasladoProducto.trasladoProductoDetalle.remisionDetalle.lote',
          ],
        });

        // controlGastosTemp.map(cg => {
        //   cg.context = el;
        // });

        for (const cg of controlGastosTemp) {
          let ingreso: IngresoOrm;
          cg.context = el;
          const historial = await historialRp.find({
            where: { controlGastoId: cg.id },
            relations: ['usuario'],
            order: { fechaCambio: 'DESC' },
          });
          if (cg.ingreso) {
            ingreso = await ingresoRp.findOne({
              where: { consecutivo: cg.ingreso.toString() },
              relations: ['paciente'],
            });
            cg.paciente = ingreso;
          }
          cg.historial = historial;
          cg.paciente = ingreso;
        }

        controlGastos.push(...controlGastosTemp);
      } catch (error: any) {
        throw new Error(error.message);
      } finally {
        await qr.release();
      }
    }

    const baseUrl = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.fmc.controlGastos.facturas}`;
    const baseUrl2 = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.inn.fmc.controlGastos.documentoAdjunto}`;

    const response = controlGastos.map(c => {
      const isTrasladoProducto = Boolean(c.trasladoProducto);
      const detalle = isTrasladoProducto
        ? mapDetalleTrasladoProducto(c)
        : mapDetalleOrdenDespacho(c);
      const ordenDespacho = isTrasladoProducto
        ? mapTrasladoProductoAsOrdenDespacho(c)
        : mapOrdenDespacho(c);

      return {
        id: c.id,
        contexto: c.context.getCode(),
        estadoCode: c.estadoCode,
        fechaCreacion: c.fechaCreacion,
        sede: c.sede ? c.sede : null,
        fechaProcedimiento: c.fechaProcedimiento,
        area: c.area,
        isVisto: c.hasVisto ? true : false,
        documentoAdjunto: c.documentoAdjuntoLink ? `${baseUrl2}/${c.documentoAdjuntoLink}` : null,
        isDocumentoRechazado: c.isDocumentoRechazado ? true : false,
        creadoPor: {
          cedula: c.creadoPor.cedula,
          nombreCompleto: c.creadoPor.nombreCompleto,
        },
        ordenDespacho,
        facturas: {
          factura1Link: c.factura1Link ? `${baseUrl}/${c.factura1Link}` : undefined,
          factura2Link: c.factura2Link ? `${baseUrl}/${c.factura2Link}` : undefined,
          factura3Link: c.factura3Link ? `${baseUrl}/${c.factura3Link}` : undefined,
          fechaFacturaAdjuntada: c.fechaUltimaFactura,
        },
        descripcion: isTrasladoProducto
          ? c.trasladoProducto.detalle
          : c.ordenDespacho?.descripcion || null,
        cantItemsConci: detalle.filter(d => d.isConciliado).length,
        detalle,
        historial: (c.historial || []).map(h => ({
          fechaCambio: h.fechaCambio,
          estadoCode: h.estadoCode,
          facturaLink: h.facturaLink ? `${baseUrl}/${h.facturaLink}` : null,
          usuario: h.usuario
            ? {
                id: h.usuario.id,
                cedula: h.usuario.cedula,
                nombreCompleto: h.usuario.nombreCompleto,
              }
            : null,
          observacion: h.observacion,
          intento: h.intento,
        })),
        paciente: c.paciente
          ? {
              id: c.paciente.id,
              consecutivo: c.paciente.consecutivo,
              fechaIngreso: c.paciente.fechaIngreso,
              nombreCompleto: c.paciente.paciente.nombreCompleto,
              numDoc: c.paciente.paciente.numDoc,
              tipoDoc: c.paciente.paciente.documento,
            }
          : null,
        isTrasladoProducto: isTrasladoProducto,
      };
    });
    // console.log(response);

    return orderBy(response, 'fechaCreacion', 'desc');
  }
}

const mapDetalleOrdenDespacho = (controlGasto: ControlGastoOrm) =>
  (controlGasto.detalle || [])
    .filter(detalle => detalle.item)
    .map(detalle => ({
      id: detalle.id,
      itemSuministroPacienteId: detalle.itemId,
      producto: {
        id: detalle.item.producto.id,
        codigo: detalle.item.producto.codigo,
        nombre: detalle.item.producto.descripcion,
      },
      lote: detalle.item.lote
        ? {
            id: detalle.item.lote.id,
            codigo: detalle.item.lote.codigo,
            fechaVencimiento: detalle.item.lote.fechaVencimiento,
          }
        : null,
      cantidad: detalle.item.cantidad,
      precio: detalle.item.precio,
      isConciliado: detalle.isConciliado,
    }));

const mapDetalleTrasladoProducto = (controlGasto: ControlGastoOrm) => {
  const detallesControlGasto = new Map(
    (controlGasto.detalle || []).map(detalle => [detalle.itemId, detalle])
  );

  return (controlGasto.trasladoProducto.trasladoProductoDetalle || []).map(detalleTraslado => {
    const detalleControlGasto = detallesControlGasto.get(detalleTraslado.id);
    const lote = detalleTraslado.remisionDetalle?.lote;

    return {
      id: detalleControlGasto?.id || detalleTraslado.id,
      itemSuministroPacienteId: detalleTraslado.id,
      producto: {
        id: detalleTraslado.producto.id,
        codigo: detalleTraslado.producto.codigo,
        nombre: detalleTraslado.producto.descripcion,
      },
      lote: lote
        ? {
            id: lote.id,
            codigo: lote.codigo,
            fechaVencimiento: lote.fechaVencimiento,
          }
        : null,
      cantidad: detalleTraslado.cantidadPendiente,
      precio: detalleTraslado.valor,
      isConciliado: detalleControlGasto?.isConciliado || false,
    };
  });
};

const mapOrdenDespacho = (controlGasto: ControlGastoOrm) => {
  if (!controlGasto.ordenDespacho?.documento) return null;

  return {
    id: controlGasto.ordenDespacho.id,
    consecutivo: controlGasto.ordenDespacho.documento.consecutivo,
    dependencia: controlGasto.ordenDespacho.dependencia
      ? {
          id: controlGasto.ordenDespacho.dependencia.id,
          codigo: controlGasto.ordenDespacho.dependencia.codigo,
          nombre: controlGasto.ordenDespacho.dependencia.nombre,
        }
      : null,
  };
};

const mapTrasladoProductoAsOrdenDespacho = (controlGasto: ControlGastoOrm) => {
  if (!controlGasto.trasladoProducto?.documento) return null;

  return {
    id: controlGasto.trasladoProducto.id,
    consecutivo: controlGasto.trasladoProducto.documento.consecutivo,
    dependencia: null,
  };
};
