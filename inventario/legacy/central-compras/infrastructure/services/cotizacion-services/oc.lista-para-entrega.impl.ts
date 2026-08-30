import { CentralComprasSource } from '../../base';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { ReportarOrdenCompraListaEntregaDto } from '@inn/lgc/ctc/presentation/dtos';
import { CotizacionOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class ReportarOrdenCompraListaParaEntregaImpl extends CentralComprasSource {
  public async execute(payload: ReportarOrdenCompraListaEntregaDto) {
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    await qr.connect();
    try {
      await qr.startTransaction();
      const cotizacionRp = qr.manager.getRepository(CotizacionOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);

      const cotizacion = await cotizacionRp.findOne({ where: { id: payload.cotizacionId } });
      const solicitud = await solicitudRp.findOne({ where: { id: cotizacion.solicitudId } });

      if (!cotizacion) throw new Error('No existe la cotización');
      if (solicitud.wasRejected()) throw new Error('Esta solicitud ya fue rechazada');
      if (!cotizacion.cotDocumentoId) throw new Error(`Esta cotización no tiene orden agregada`);

      await this.createCambioEstado(qr, {
        solicitud,
        estado: ESTADOS.SOL_ULTIMOS_PASOS,
        entidadRelacionadaId: cotizacion.id,
        estadoEspecifico: ESTADOS_ESPECIFICOS.COTI_LISTA_PARA_ENTREGA,
        informacionAdicional: payload.observaciones,
      });

      cotizacion.listaParaEntrega = true;
      await cotizacionRp.save(cotizacion);
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
