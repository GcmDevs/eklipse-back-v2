import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { getListaEsperaQuery, getListaEsperaReferenciaQuery } from '../queries';
import {
  ListaEsperaCamaReferenciaResponse,
  ListaEsperaCamaResponse,
  ListaEsperaCamaResponseQuery,
  ListaEsperaReferenciaResponseQuery,
} from '../responses';

@Injectable()
export class ListaEsperaCamaReferenciaSourceRepository extends BaseSource {
  public async getListaEsperaReferencia(ctx: GcmContexts) {
    const qr = this.dynamicQR(gcmContextFactory(ctx));
    try {
      await qr.connect();

      // const fechaInicial = new Date(fechaIni).toISOString().split('T')[0];
      // const fechaFinal = new Date(fechaFin).toISOString().split('T')[0];

      const hospiResult: ListaEsperaCamaResponseQuery[] = await qr.manager.query(
        getListaEsperaQuery()
      );
      const referenciaResult: ListaEsperaReferenciaResponseQuery[] = await qr.manager.query(
        getListaEsperaReferenciaQuery()
      );

      const listaEsperaData: ListaEsperaCamaResponse[] = hospiResult.map(item => ({
        acanombre: item.ACANOMBRE,
        ingreso: item.INGRESO,
        fechaIngreso: item.FECHA_INGRESO,
        nombrePaciente: item.NOMBREPACIENTE,
        pacienteDocu: item.PACIENTEDOCU,
        edad: item.EDAD,
        eps: item.EPS,
        sexo: item.SEXO,
        horasDesdeIngreso: item.HORAS_DESDE_INGRESO,
        cama: item.CAMA,
        hsunombre: item.HSUNOMBRE,
        tipoIngreso: item.TIPO_INGRESO_CODE,
        estadoIngreso: item.ESTADO_INGRESO_CODE,
        ordenHospPendiente: item.ORDEN_HOSP_PENDIENTE,
        tipoOrdenHosp: item.TIPO_ORDEN_HOSP_CODE,
        fechaHospPendiente: item.FECHA_HOSP_PENDIENTE,
        diagnostico: item.DIAGNOSTICO,
        primerOrdenHospitalizacion: item.PRIMER_ORDEN_HOSP,
        primerTipoOrdenHospitalizacion: item.PRIMER_TIPO_ORDEN_HOSP,
        evolucionUrgencia: item.EVO_URG_SI,
        evolucionHospitalizacion: item.EVO_HOSP_SI,
        evolucionUCI: item.EVO_UCI_SI,
        evolucionUrgenciaDestino: item.EVO_URG_DESTINO,
      }));

      const listaEsperaReferencia: ListaEsperaCamaReferenciaResponse[] = referenciaResult.map(
        item => ({
          consecutivo: item.CONSECUTIVO,
          fechaSol: item.FECHA_SOL,
          estado: item.ESTADO,
          pacienteAceptado: item.PACIENTE_ACEPTADO,
          prioridad: item.PRIORIDAD,
          tipoDocPac: item.TIPO_DOC_PAC,
          servicioQueremite: item.SERVICIO_QUEREMITE,
          servicioAlqueremite: item.SERVICIO_ALQUEREMITE,
          numDocumento: item.NUM_DOCUMENTO,
          ingreso: item.INGRESO,
          nombreCama: item.NOMBRE_CAMA,
          fechaIngreso: item.FECHA_INGRESO,
          ingresoPor: item.INGRESO_POR,
          diagnostico: item.DIAGNOSTICO,
          primerNombre: item.PRIMER_NOMBRE,
          segundoNombre: item.SEGUNDO_NOMBRE,
          primerApellido: item.PRIMER_APELLIDO,
          segundoApellido: item.SEGUNDO_APELLIDO,
          edad: item.EDAD,
          sexo: item.SEXO,
          entiReferencia: item.ENTI_REFERENCIA,
          eps: item.EPS,
          entnombre: item.ENTNOMBRE,
          municipio: item.MUNICIPIO,
          departamento: item.DEPARTAMENTO,
          medico: item.MEDICO,
          tramite: item.TRAMITE,
          motRemi: item.MOT_REMI,
          motRemi2: item.MOT_REMI2,
          funcionaContesta: item.FUNCIONA_CONTESTA,
          obsSeguimiento: item.OBS_SEGUIMIENTO,
          fecAceptacion: item.FEC_ACEPTACION,
          obsCierre: item.OBS_CIERRE,
          especialidad: item.ESPECIALIDAD,
          fechaTrasladoPac: item.FECHA_TRASLADO_PAC,
          cedula: item.CEDULA,
          nombre: item.NOMBRE,
        })
      );

      return {
        hospi: listaEsperaData,
        referencia: listaEsperaReferencia,
      };
      // return referenciaResult;
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
