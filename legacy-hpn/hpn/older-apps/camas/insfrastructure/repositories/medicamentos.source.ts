import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { getMedicamentosQuery } from '../queries';
import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { MedicamentosResponse, MedicamentosResponseQuery } from '../responses';

@Injectable()
export class MedicamentosSourceRepository extends BaseSource {
  public async getMedicamentos(
    ctx: GcmContexts,
    consecutivo: number
  ): Promise<MedicamentosResponse[]> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));

    try {
      const result: MedicamentosResponseQuery[] = await qr.query(getMedicamentosQuery(consecutivo));

      // if (!result || result.length === 0) {
      //   throw new Error('No se encontraron resultados para los examenes solicitados');
      // }
      return result.map(medicamento => ({
        tipo: medicamento.TIPO,
        ingreso: medicamento.INGRESO,
        fecSolicitud: medicamento.FEC_SOLICITUD,
        horas: medicamento.HORAS,
        suministro: medicamento.SUMINISTRO,
        producto: medicamento.PRODUCTO,
        nombreProducto: medicamento.NOMBRE_PRODUCTO,
        solicitado: medicamento.SOLICITADO,
        devuelta: medicamento.DEVUELTA,
        aplicada: medicamento.APLICADA,
        pendiente: medicamento.PENDIENTE,
        almacenSolicitado: medicamento.ALMACEN_SOLICITADO,
        areaSolicito: medicamento.AREA_SOLICITO,
        odInnmsumpa: medicamento.od_INNMSUMPA,
        sede: medicamento.SEDE,
        cama: medicamento.CAMA,
        servicio: medicamento.SERVICIO,
        identificacion: medicamento.IDENTIFICACION,
        paciente: medicamento.PACIENTE,
      }));
    } catch (error) {
      throw new BadRequestException(error);
    } finally {
      await qr.release();
    }
  }
}
