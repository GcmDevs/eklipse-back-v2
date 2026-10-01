import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../base';
import { FILE_LOCATIONS, IVA } from '@common/application/constants';
import { CotizacionOrm, DetalleCotizacionOrm, SolicitudOrm } from '@orm/inn/central-compras';
import { OldCrearCotizacionDto } from '../../presentation/dtos';
import { deleteFile } from '@common/presentation/helpers';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { gcmContextFactory } from '@common/domain/types';
import { ProveedorOrm } from '@orm/gen';

@Injectable()
export class CotizacionCrudSource extends CentralComprasSource {
  public async create(payload: OldCrearCotizacionDto) {
    const ds = this.dynamicConn(gcmContextFactory(payload.context));
    const localQr = ds.createQueryRunner();
    await localQr.startTransaction();
    try {
      const cotizacionRp = localQr.manager.getRepository(CotizacionOrm);
      const solicitudRp = localQr.manager.getRepository(SolicitudOrm);
      const detalleCotizacionRp = localQr.manager.getRepository(DetalleCotizacionOrm);
      const proveedorRp = localQr.manager.getRepository(ProveedorOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: payload.solicitudId } });
      const cotizaciones = await cotizacionRp.find({ where: { solicitudId: payload.solicitudId } });

      if (cotizaciones.length >= 3) {
        throw new Error('Ya no puede agregar mas cotizaciones');
      }

      if (solicitud.isCotizacionUnica && cotizaciones.length) {
        throw new Error('Solo puede haber una cotización para esta solicitud');
      }

      if (
        [ESTADOS.SOL_APROBADA.getCode(), ESTADOS.SOL_EN_COTI.getCode()].indexOf(
          solicitud.estadoCode
        ) < 0
      ) {
        throw new Error('La solicitud está en un proceso en el cual ya no se aceptan cotizaciones');
      }

      cotizaciones.forEach(cot => {
        if (cot.proveedorId && cot.proveedorId === payload.proveedorId) {
          throw new Error('Solo puede haber una cotización por proveedor');
        }
      });

      if (payload.isCotizacionUnica && !cotizaciones.length) solicitud.isCotizacionUnica = true;

      if (payload.isPagoPorCajaMenor && !cotizaciones.length) {
        solicitud.isPagoPorCajaMenor = true;
      }

      solicitud.estadoCode = ESTADOS.SOL_EN_COTI.getCode();
      await solicitudRp.save(solicitud);

      const proveedor = payload.proveedorId
        ? await proveedorRp.findOne({ where: { id: payload.proveedorId } })
        : null;

      const newCotizacion = new CotizacionOrm();
      newCotizacion.solicitud = solicitud;
      newCotizacion.proveedorId = proveedor ? proveedor.id : null;

      const cotizacionStored = await cotizacionRp.save(newCotizacion);

      const detalleCotizacion: DetalleCotizacionOrm[] = [];

      for (let i = 0; i < payload.detalle.length; i++) {
        const item = payload.detalle[i];

        if (item.porcDescuento < 0 || item.porcDescuento > 100) {
          throw new Error('El % desc. debe ser un valor entre 0 y 100');
        }

        const newItem = new DetalleCotizacionOrm();
        newItem.solicitudId = solicitud.id;
        newItem.cotizacionId = cotizacionStored.id;
        newItem.itemId = item.itemCotizadoId;
        newItem.valorUnitario = item.valorUnitario;
        newItem.descuento = item.porcDescuento;
        newItem.IVA = item.incluyeIVA ? IVA : 0;
        newItem.isAprobado = false;

        detalleCotizacion.push(newItem);
      }

      const detalleCotizacionStored = await detalleCotizacionRp.save(detalleCotizacion);

      cotizacionStored.detalle = detalleCotizacionStored;

      const newEstado = await this.createCambioEstadoDeprecated(localQr, {
        estadoCode: ESTADOS.SOL_EN_COTI.getCode(),
        estadoEspecificoCode: ESTADOS_ESPECIFICOS.SOL_COTI_AGREGADA.getCode(),
        solicitud,
        entidadRelacionadaId: cotizacionStored.id,
        archivoRelacionado: payload.fileName,
        informacionAdicional: !payload.proveedorId ? `${payload.nombreProveedor}` : null,
      });

      newEstado.setTypes();

      await localQr.commitTransaction();

      return {
        cotizacion: newCotizacion,
        estado: newEstado,
      };
    } catch (error) {
      await localQr.rollbackTransaction();
      deleteFile(`${FILE_LOCATIONS.inn.ctc.cotizaciones}/${payload.fileName}`);
      throw new BadRequestException(error.message);
    } finally {
      await localQr.release();
    }
  }
}
