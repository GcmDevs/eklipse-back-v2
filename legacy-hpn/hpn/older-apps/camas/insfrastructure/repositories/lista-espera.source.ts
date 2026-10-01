import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { getListaEsperaQuery } from '../queries';
import { ListaEsperaCamaResponse, ListaEsperaCamaResponseQuery } from '../responses';

@Injectable()
export class ListaEsperaCamaSourceRepository extends BaseSource {
  public async getListaEspera(ctx: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();
      const result: ListaEsperaCamaResponseQuery[] = await qr.manager.query(getListaEsperaQuery());

      const listaEsperaData: ListaEsperaCamaResponse[] = result.map(item => ({
        acanombre: item.ACANOMBRE,
        ingreso: item.INGRESO,
        fechaIngreso: item.FECHA_INGRESO,
        nombrePaciente: item.NOMBREPACIENTE,
        pacienteDocu: item.PACIENTEDOCU,
        horasDesdeIngreso: item.HORAS_DESDE_INGRESO,
        cama: item.CAMA,
        edad: item.EDAD,
        eps: item.EPS,
        sexo: item.SEXO,
        hsunombre: item.HSUNOMBRE,
        tipoIngreso: item.TIPO_INGRESO_CODE,
        estadoIngreso: item.ESTADO_INGRESO_CODE,
        ordenHospPendiente: item.ORDEN_HOSP_PENDIENTE,
        tipoOrdenHosp: item.TIPO_ORDEN_HOSP_CODE,
        fechaHospPendiente: item.FECHA_HOSP_PENDIENTE,
        diagnostico: item.DIAGNOSTICO,
      }));

      return listaEsperaData;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
