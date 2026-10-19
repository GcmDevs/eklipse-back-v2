import { In, Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { OrdenDespachoOrm, TrasladoProductoDetalleOrm } from '@orm/inn/documentos';
import {
  ordenDespachoOrmToOrdenDespachoRes,
  ordenDespachoOrmToTrasladoProductoRes,
} from '../factories';
import { TIPOS_DOCUMENTO } from '@ctypes/inn/documentos';

@Injectable()
export class OrdenDespachoSource extends BaseSource {
  public async fetchByCentroAndPattern(pattern: string, contextCode: GcmContextCode) {
    const qr = this.dynamicQR(gcmContextFactory(contextCode));
    await qr.connect();
    try {
      const ordenDespachoRp = qr.manager.getRepository(OrdenDespachoOrm);

      const ordenesDespacho = await ordenDespachoRp.find({
        where: { documento: { consecutivo: Like(`%${pattern}%`) } },
        relations: ['documento', 'detalle', 'detalle.producto'],
        take: 5,
      });

      return ordenesDespacho.map(data => ordenDespachoOrmToOrdenDespachoRes(data));
    } catch (error) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  public async fetchOrdenDespachoByCentroAndPatternAndDocumento(
    pattern: string,
    contextCode: GcmContextCode,
    isTrasladoProducto: boolean | string
  ) {
    const qr = this.dynamicQR(gcmContextFactory(contextCode));
    await qr.connect();
    try {
      const shouldFetchTrasladoProducto = String(isTrasladoProducto).toLowerCase() === 'true';

      const documentos: any[] = await qr.query(
        `select TOP(1) OID id,
          IDCONSEC consecutivo,
          IDFECCRE fechaCreacion,
          IDFECCON fechaConfirmacion,
          IDFECANU fechaAnulacion
          from INNDOCUME  where IDTIPDOC = ${
            shouldFetchTrasladoProducto
              ? TIPOS_DOCUMENTO.TRASLADO_PRODUCTOS_CONSIGNACION.getCode()
              : TIPOS_DOCUMENTO.ORDEN_DESPACHO.getCode()
          } and IDCONSEC like @0  order by oid desc`,
        [`%${pattern}%`]
      );

      const documentoIds = documentos.map(documento => documento.id);

      if (!documentoIds.length) return [];

      if (shouldFetchTrasladoProducto) {
        const trasladoProductoDetalleRp = qr.manager.getRepository(TrasladoProductoDetalleOrm);

        const trasladoProductos = await trasladoProductoDetalleRp.find({
          where: { trasladoProductoId: In(documentoIds) },
          relations: ['trasladoProducto', 'trasladoProducto.documento'],
          take: 1,
        });

        return trasladoProductos.map(data =>
          ordenDespachoOrmToTrasladoProductoRes(data.trasladoProducto)
        );
      }

      const suministroPacienteRp = qr.manager.getRepository(OrdenDespachoOrm);

      const suministrosPaciente = await suministroPacienteRp.find({
        where: { id: In(documentoIds) },
        relations: ['detalle', 'detalle.producto'],
        take: 1,
      });

      suministrosPaciente.forEach(suministroPaciente => {
        suministroPaciente.documento = documentos.find(
          documento => documento.id === suministroPaciente.id
        );
      });

      return suministrosPaciente.map(data => ordenDespachoOrmToOrdenDespachoRes(data));
    } catch (error) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
