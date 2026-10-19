import { In } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DetalleOrdenDespachoOrm, DocumentoOrm, OrdenDespachoOrm } from '@orm/inn/documentos';
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO } from '@ctypes/inn/documentos';
import { ORDESItemRecibidoDto } from '@inn/documentos/presentation/dtos';
import { generarConsecutivo } from '@common/application/services';
import { ESTADOS_ENTREGA } from '@gtypes/inn/orden-despacho';
import { BaseSource } from '@common/infrastructure/services';
import { dataToDocumentoOrm } from '../../factories';
import { ConsecutivoOrm } from '@inn/orm/gen';

export const messageForError = (tipo: number) => {
  switch (tipo) {
    case 1:
      return 'No existe orden de despacho con este id';
    case 2:
      return 'No existe un consecutivo perteneciente al almacén de origen de la orden de despacho';
    case 3:
      return 'Existe un recibo para esta orden de despacho que ha sido confirmado o no ha sido anulado';
    default:
      return 'Error desconocido, consulte a los desarrolladores';
  }
};

@Injectable()
export class RecibirItemsOrdenDespachoImpl extends BaseSource {
  public async execute(payload: ORDESItemRecibidoDto[]) {
    if (payload.length) {
      let transactionWasStarted = false;
      let errorType = 0;
      await this.qr.connect();
      try {
        const detOrdDespRp = this.qr.manager.getRepository(DetalleOrdenDespachoOrm);
        const consecutivoRp = this.qr.manager.getRepository(ConsecutivoOrm);
        const ordDespRp = this.qr.manager.getRepository(OrdenDespachoOrm);
        const documentoRp = this.qr.manager.getRepository(DocumentoOrm);

        // Obtener orden de despacho a partir del primer detalle encontrado
        const detalleOrdenDespacho = await detOrdDespRp.findOne({
          where: { id: payload[0].id },
          relations: ['ordenDespacho'],
          select: { id: true, ordenDespacho: { id: true } },
        });

        // Obtiene orden de despacho
        const ordenDespacho = await ordDespRp.findOne({
          where: { id: detalleOrdenDespacho.ordenDespacho.id },
          relations: ['almacenOrigen'],
          select: {
            id: true,
            almacenOrigen: { id: true, codigo: true, prefijo: true },
            reciboId: true,
          },
        });
        if (!ordenDespacho) errorType = 1;
        // Obtiene consecutivo para recibo orden de despacho
        const consecutivoByAlmacenOrigen = await consecutivoRp.findOne({
          where: { nombre: `IN-Recibo_Orden_Despacho-AL${ordenDespacho.almacenOrigen.codigo}` },
        });
        if (!consecutivoByAlmacenOrigen) errorType = 2;
        // Validar si existe recibo previo o este fue anulado
        let existeReciboOrDes = false;
        if (ordenDespacho.reciboId) {
          const reciboExistente = await documentoRp.findOne({
            where: { id: ordenDespacho.reciboId },
            relations: ['confirmadoPor', 'anuladoPor'],
            select: { id: true, confirmadoPor: { id: true }, anuladoPor: { id: true } },
          });

          if (reciboExistente.confirmadoPor || !reciboExistente.anuladoPor) {
            existeReciboOrDes = true;
            errorType = 3;
          }
        }

        // Empezar transacción si existe orden de despacho y consecutivo por el almacen de origen
        if (ordenDespacho && consecutivoByAlmacenOrigen && !existeReciboOrDes) {
          await this.qr.startTransaction();
          // Declara que ha iniciado una transacción
          transactionWasStarted = true;

          // Aqui se modifica la cantidad recibida de los items
          const ids = payload.map(el => el.id);
          const detallesOrdenDespacho = await detOrdDespRp.find({ where: { id: In(ids) } });

          detallesOrdenDespacho.map(det => {
            const itemFromPayload = payload.filter(item => item.id === det.id).length
              ? payload.filter(item => item.id === det.id)[0]
              : undefined;

            if (itemFromPayload) {
              if (itemFromPayload.cantidad > det.cantidad || itemFromPayload.cantidad < 0) {
                throw new BadRequestException(
                  `Cantidad no valida para sum. id ${det.id}, debe agregar cantidad recibida entre  0 y ${det.cantidad}`
                );
              } else {
                det.cantidadRecibida = itemFromPayload.cantidad;
                det.OptimisticLockField = 1;
              }
            } else {
              throw new BadRequestException(`No existe detalle de suministro con el id ${det.id}`);
            }
          });

          // Generar parte numerica del codigo del proximo consecutivo
          const proximoNumeroConsecutivo = consecutivoByAlmacenOrigen.numero + 1;

          consecutivoByAlmacenOrigen.numero = proximoNumeroConsecutivo;
          const consecutivoReciboOrDes = generarConsecutivo(
            ordenDespacho.almacenOrigen.prefijo,
            proximoNumeroConsecutivo
          );
          // Generar recibo orden de despacho
          const newReciboOrDes = dataToDocumentoOrm({
            consecutivo: consecutivoReciboOrDes,
            tipo: TIPOS_DOCUMENTO.RECIBO_ORDEN_DESPACHO.getCode(),
            estado: ESTADOS_DOCUMENTO.REGISTRADO.getCode(),
            creadoPorId: this.auth.id,
            optimisticLockField: 0,
            objectType: 532564,
          });

          await detOrdDespRp.save(detallesOrdenDespacho);
          const documentoStored = await documentoRp.save(newReciboOrDes);
          await consecutivoRp.save(consecutivoByAlmacenOrigen);

          // Se genera la relación entre el recibo y la orden de despacho
          await this.qr.manager.query(`INSERT INTO INNRECORDES (OID, INNORDDESC) VALUES (@0, @1)`, [
            documentoStored.id,
            ordenDespacho.id,
          ]);

          ordenDespacho.estadoEntregaCode = ESTADOS_ENTREGA.PENDIENTE.getCode();
          ordenDespacho.reciboId = documentoStored.id;
          await ordDespRp.save(ordenDespacho);

          await this.qr.commitTransaction();
          return true;
        } else {
          throw new BadRequestException(messageForError(errorType));
        }
      } catch (error) {
        if (transactionWasStarted) await this.qr.rollbackTransaction();
        throw new BadRequestException(error);
      } finally {
        await this.qr.release();
      }
    } else {
      throw new BadRequestException(`No envió ningún item en el payload`);
    }
  }
}
