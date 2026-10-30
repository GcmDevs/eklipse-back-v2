import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  AsociarOrdenControlGastosPayload,
  DescartarOrdenControlGastosPayload,
  SolicitudOrdenesControlGastosPayload,
} from '@inn/lgc/cgt/application/payloads';
import {
  ControlGastoArchivoOrm,
  ControlGastoHistorialOrm,
  ControlGastoOrm,
} from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos';
import { ESTADOS_CONTROL_GASTO } from '@inn/lgc/cgt/types';
import { resolverOrdenRelacionada } from './orden-relacionada';
import { mapOrdenesControlGasto, mapTrasladosControlGasto } from './ordenes-control-gasto.mapper';
import { cargarDocumentosRelacionados } from './cargar-documentos-relacionados';

type GrupoOrden = 'compra' | 'traslado';

@Injectable()
export class OrdenesControlGastoImpl extends BaseSource {
  async consultar(payload: SolicitudOrdenesControlGastosPayload) {
    this.validarSolicitud(payload);
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    try {
      await qr.connect();
      return await this.respuesta(qr, payload.idControlGasto);
    } finally {
      await qr.release();
    }
  }

  async agregar(payload: AsociarOrdenControlGastosPayload) {
    const esTraslado = payload.ordenRelacionadaTipoCode === 24;
    return this.modificar(
      payload,
      async (qr, gasto) => {
        const orden = await resolverOrdenRelacionada(
          payload.ordenRelacionadaTipoCode,
          payload.ordenRelacionadaConsecutivo
        );
        if (!orden) throw new Error('Indique el tipo y consecutivo de la orden');
        const actual = await this.respuesta(qr, gasto.id);
        const ordenes = esTraslado ? actual.ordenesTraslado : actual.ordenes;
        if (ordenes.some(item => item.documentoId === orden.id && !item.rechazadoAt)) {
          throw new Error('Esta orden ya está cargada en la solicitud');
        }
        const archivo = new ControlGastoArchivoOrm();
        archivo.controlGastoId = gasto.id;
        //archivo.usuarioId = this.auth.id;
        archivo.documentoId = orden.id;
        archivo.tipoCode = esTraslado ? 3 : payload.ordenRelacionadaTipoCode === 0 ? 1 : 2;
        archivo.updatedAt = new Date();
        archivo.rechazadoAt = null;
        archivo.motivoRechazo = null;
        await qr.manager.getRepository(ControlGastoArchivoOrm).save(archivo);
        await this.historial(
          qr,
          gasto,
          `Orden ${esTraslado ? 'de traslado ' : ''}${orden.consecutivo} agregada`
        );
      },
      esTraslado ? 'traslado' : 'compra'
    );
  }

  async descartar(payload: DescartarOrdenControlGastosPayload) {
    const esTraslado = payload.grupo === 'traslado';
    if (esTraslado && !payload.archivoId)
      throw new Error('Indique la orden de traslado a descartar');
    if (
      (!payload.archivoId && !payload.documentoAnteriorId) ||
      (payload.archivoId && payload.documentoAnteriorId)
    ) {
      throw new Error('Indique una sola orden para descartar');
    }
    if (
      payload.motivoRechazo != null &&
      (typeof payload.motivoRechazo !== 'string' || payload.motivoRechazo.length > 300)
    ) {
      throw new Error('El motivo de descarte admite máximo 300 caracteres');
    }
    return this.modificar(
      payload,
      async (qr, gasto) => {
        const rp = qr.manager.getRepository(ControlGastoArchivoOrm);
        let archivo: ControlGastoArchivoOrm;
        if (payload.archivoId) {
          archivo = await rp.findOne({
            where: { id: payload.archivoId, controlGastoId: gasto.id },
          });
          if (!archivo || !(esTraslado ? [3] : [1, 2]).includes(archivo.tipoCode)) {
            throw new Error(
              'La orden no pertenece a esta solicitud o al tipo de documento indicado'
            );
          }
          if (archivo.rechazadoAt) throw new Error('La orden ya fue descartada');
        } else {
          const actual = await this.respuesta(qr, gasto.id);
          const anterior = actual.ordenes.find(
            orden => orden.esAnterior && orden.documentoId === payload.documentoAnteriorId
          );
          if (!anterior)
            throw new Error('La orden anterior no pertenece a esta solicitud o ya fue descartada');
          archivo = new ControlGastoArchivoOrm();
          archivo.controlGastoId = gasto.id;
          //archivo.usuarioId = this.auth.id;
          archivo.documentoId = anterior.documentoId;
          archivo.tipoCode = anterior.tipoCode === 0 ? 1 : 2;
          archivo.updatedAt = new Date();
        }
        archivo.rechazadoAt = new Date();
        archivo.motivoRechazo = payload.motivoRechazo?.trim() || null;
        await rp.save(archivo);
        await this.historial(
          qr,
          gasto,
          `Orden ${esTraslado ? 'de traslado ' : ''}${archivo.documentoId} descartada`
        );
      },
      esTraslado ? 'traslado' : 'compra'
    );
  }

  async finalizar(payload: SolicitudOrdenesControlGastosPayload) {
    const esTraslado = payload.grupo === 'traslado';
    return this.modificar(
      payload,
      async (qr, gasto) => {
        const actual = await this.respuesta(qr, gasto.id);
        const activas = (esTraslado ? actual.ordenesTraslado : actual.ordenes).filter(
          orden => !orden.rechazadoAt
        );
        if (!activas.length)
          throw new Error('Debe cargar al menos una orden vigente antes de finalizar');
        gasto.estadoCode = esTraslado
          ? ESTADOS_CONTROL_GASTO.ORDENES_TRASLADO_CARGADAS.getCode()
          : ESTADOS_CONTROL_GASTO.ORDENES_CARGADAS.getCode();
        if (esTraslado) gasto.requiereOrdenesTraslado = true;
        else gasto.requiereOrdenesCompraServicio = true;
        await qr.manager.getRepository(ControlGastoOrm).save(gasto);
        await this.historial(
          qr,
          gasto,
          `Carga de órdenes ${esTraslado ? 'de traslado ' : ''}finalizada: ${activas.length} orden(es) vigente(s)`
        );
      },
      esTraslado ? 'traslado' : 'compra'
    );
  }

  async omitirTraslados(payload: SolicitudOrdenesControlGastosPayload) {
    return this.omitirOrdenes(payload, 'traslado');
  }

  async omitirCompras(payload: SolicitudOrdenesControlGastosPayload) {
    return this.omitirOrdenes(payload, 'compra');
  }

  private async omitirOrdenes(payload: SolicitudOrdenesControlGastosPayload, grupo: GrupoOrden) {
    const esTraslado = grupo === 'traslado';
    const descripcion = esTraslado ? 'órdenes de traslado' : 'órdenes de compra o servicio';
    return this.modificar(
      payload,
      async (qr, gasto) => {
        const actual = await this.respuesta(qr, gasto.id);
        const ordenes = esTraslado ? actual.ordenesTraslado : actual.ordenes;
        if (ordenes.some(orden => !orden.rechazadoAt)) {
          throw new Error(
            `Descarte las ${descripcion} vigentes antes de indicar que no se requieren`
          );
        }
        if (esTraslado) gasto.requiereOrdenesTraslado = false;
        else gasto.requiereOrdenesCompraServicio = false;
        gasto.estadoCode = esTraslado
          ? ESTADOS_CONTROL_GASTO.ORDENES_TRASLADO_CARGADAS.getCode()
          : ESTADOS_CONTROL_GASTO.ORDENES_CARGADAS.getCode();
        await qr.manager.getRepository(ControlGastoOrm).save(gasto);
        await this.historial(qr, gasto, `La solicitud no requiere ${descripcion}`);
      },
      grupo
    );
  }

  private async modificar(
    payload: SolicitudOrdenesControlGastosPayload,
    action: (qr: QueryRunner, gasto: ControlGastoOrm) => Promise<void>,
    grupo: GrupoOrden
  ) {
    this.validarSolicitud(payload);
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    try {
      await qr.connect();
      await qr.startTransaction();
      const gasto = await qr.manager
        .getRepository(ControlGastoOrm)
        .findOne({ where: { id: payload.idControlGasto }, lock: { mode: 'pessimistic_write' } });
      if (!gasto) throw new Error('No existe la solicitud');
      const estadoRequerido =
        grupo === 'traslado'
          ? ESTADOS_CONTROL_GASTO.ORDENES_CARGADAS.getCode()
          : ESTADOS_CONTROL_GASTO.PENDIENTE.getCode();
      if (gasto.estadoCode !== estadoRequerido) {
        throw new Error(
          grupo === 'traslado'
            ? 'Solo se pueden agregar, descartar o finalizar traslados en estado OC/OS CARGADAS'
            : 'Solo se pueden agregar, descartar o finalizar OC/OS en estado PENDIENTE'
        );
      }
      await action(qr, gasto);
      const response = await this.respuesta(qr, gasto.id);
      await qr.commitTransaction();
      return response;
    } catch (error) {
      if (qr.isTransactionActive) await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  private async respuesta(qr: QueryRunner, id: number) {
    const gasto = await qr.manager.getRepository(ControlGastoOrm).findOne({
      where: { id },
      relations: ['ordenRelacionada', 'archivos', 'archivos.documento'],
    });
    if (!gasto) throw new Error('No existe la solicitud');
    await cargarDocumentosRelacionados([gasto]);
    return {
      estadoCode: gasto.estadoCode,
      requiereOrdenesTraslado: gasto.requiereOrdenesTraslado,
      requiereOrdenesCompraServicio: gasto.requiereOrdenesCompraServicio,
      ordenes: mapOrdenesControlGasto(gasto),
      ordenesTraslado: mapTrasladosControlGasto(gasto),
    };
  }

  private async historial(qr: QueryRunner, gasto: ControlGastoOrm, observacion: string) {
    const historial = new ControlGastoHistorialOrm();
    historial.controlGastoId = gasto.id;
    historial.estadoCode = gasto.estadoCode;
    historial.usuarioId = this.auth.id;
    historial.fechaCambio = new Date();
    historial.observacion = observacion;
    await qr.manager.getRepository(ControlGastoHistorialOrm).save(historial);
  }

  private validarSolicitud(payload: SolicitudOrdenesControlGastosPayload) {
    if (!Number.isInteger(payload.idControlGasto) || payload.idControlGasto <= 0)
      throw new Error('Indique una solicitud válida');
  }
}
