import { In } from 'typeorm';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { switchConn } from '@common/infrastructure/services';
import { DocumentoOrm, OrdenDespachoOrm } from '@orm/inn/documentos';
import { dataToFetchOrdDescPendienteRes } from '../../factories';
import { ESTADOS_ENTREGA } from '@gtypes/inn/orden-despacho';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { ITokenDecoded, JWTServices } from '@common/application/services';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

interface RecordesI {
  reciboId: number;
  ordenDespachoId: number;
}

@Injectable()
export class FetchOrdenesDespachoPendientesImpl {
  constructor(@Inject(REQUEST) private _request: Request) {}

  public async execute(contextCode: GcmContextCode) {
    const conn = contextCode
      ? switchConn(gcmContextFactory(contextCode))
      : switchConn(this._auth.context);

    const ordDesRp = conn.getRepository(OrdenDespachoOrm);
    const documentoRp = conn.getRepository(DocumentoOrm);

    const ordDesPendientes = await ordDesRp.find({
      where: { estadoEntregaCode: ESTADOS_ENTREGA.PENDIENTE.getCode() },
      select: { id: true },
    });

    const ordDesIds = ordDesPendientes.map(od => od.id);

    const recordes: RecordesI[] = await conn.query(
      `SELECT OID reciboId, INNORDDESC ordenDespachoId
      FROM INNRECORDES WHERE INNORDDESC IN (${ordDesIds})`
    );

    const recibosordDesIds = recordes.map(el => el.reciboId);

    const recibosOrdDes = await documentoRp.find({
      where: { id: In(recibosordDesIds) },
      relations: ['confirmadoPor', 'anuladoPor'],
      select: { id: true, confirmadoPor: { id: true }, anuladoPor: { id: true } },
    });

    const ordDesPendientesNoRecibidas: OrdenDespachoOrm[] = [];

    ordDesPendientes.forEach(ordDesPendiente => {
      let canBeModified = true;
      const ordDesTieneRecibo = recordes.filter(res => res.ordenDespachoId === ordDesPendiente.id);

      if (ordDesTieneRecibo.length) {
        const reciboIds = ordDesTieneRecibo.map(el => el.reciboId);

        const recibos = recibosOrdDes.filter(recibo => reciboIds.indexOf(recibo.id) >= 0);

        recibos.forEach(recibo => {
          if (recibo.confirmadoPor || !recibo.anuladoPor) canBeModified = false;
        });
      }

      if (canBeModified) ordDesPendientesNoRecibidas.push(ordDesPendiente);
    });

    const ordDesPendientesIds = ordDesPendientesNoRecibidas.map(el => el.id);

    const documentos = await documentoRp.find({
      where: { id: In(ordDesPendientesIds) },
      relations: ['creadoPor'],
      select: {
        id: true,
        consecutivo: true,
        creadoPor: { cedula: true, nombreCompleto: true },
        fechaCreacion: true,
      },
    });

    const ordenesDespacho = await ordDesRp.find({
      where: { id: In(ordDesPendientesIds) },
      relations: ['detalle', 'detalle.producto'],
      select: {
        id: true,
        // tipoCode: true,
        tipoOrdenCode: true,
        destinoCode: true,
        estadoEntregaCode: true,
        detalle: {
          id: true,
          producto: { id: true, descripcion: true, descripcionLarga: true, codigo: true },
          cantidad: true,
          cantidadSolicitada: true,
          cantidadRecibida: true,
          cantidadDevuelta: true,
        },
      },
    });

    ordenesDespacho.map(od => {
      const doc = documentos.filter(documento => documento.id === od.id);
      if (doc.length) {
        od.documentoRelacionado = {
          documentoId: doc[0].id,
          documento: doc[0],
          ordenDespacho: null!,
        };
      }
    });

    return ordenesDespacho.map(el => dataToFetchOrdDescPendienteRes(el));
  }

  private get _auth() {
    try {
      const tkDecoded = this._getTokenDecoded();

      if (!tkDecoded.tablePath) tkDecoded.tablePath = 'GENUSUARIO';

      const id = tkDecoded.user.id;
      const user = tkDecoded.user;
      const context = tkDecoded.context;
      const tablePath = tkDecoded.tablePath;

      return { id, user, tablePath, context };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  private _getTokenDecoded(): ITokenDecoded {
    const tkDcd = JWTServices.decodeToken(this._request.headers.authorization!.split(' ')[1]);
    return tkDcd;
  }
}
