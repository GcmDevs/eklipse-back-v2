import { Injectable } from '@nestjs/common';
import { transformCamaResponseToCamaDto } from '../factories';
import { fetchCamasQuery, fetchPacientes, fetchPacientesHospitalizados } from '../queries';
import { CamaDto } from '../../application/dtos';
import { In } from 'typeorm';
import { GcmContexts } from '@common/application/constants';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudReferenciaOrm } from '@hpn/old/orm/solicitud-referencia.orm';
import { allContexts } from 'hpn/older-apps/constants';
import { gcmContextFactory } from '@common/domain/types';
import { EstadosCama } from '../../application/constants';

@Injectable()
export class CamaSourceRepository extends BaseSource {
  public async fetchDisponibles(allCtx: boolean): Promise<CamaDto[]> {
    const camas: CamaDto[] = [];
    const CONTEXTS = allCtx ? allContexts([GcmContexts.AMMEDICAL]) : [this.auth.context.getCode()];

    for (let i = 0; i < CONTEXTS.length; i++) {
      const qr = this.dynamicQR(gcmContextFactory(CONTEXTS[i]));
      try {
        await qr.connect();

        const result = await qr.query(fetchCamasQuery());

        // const evolution: EvolucionesResponse[] = await qr.query('seguimiento_evolucion_pacientes');

        const response = transformCamaResponseToCamaDto(result, CONTEXTS[i]);

        const camasReservadas = response.filter(el => el.estado.codigo === EstadosCama.RESERVADA);

        const camasReservadasIds = camasReservadas.map(el => el.id);

        const solicitudRp = qr.manager.getRepository(SolicitudReferenciaOrm);

        const solicitudes = await solicitudRp.find({
          where: { CamaId: In(camasReservadasIds), isActiva: true },
          relations: ['createdBy'],
        });

        let solicitudesPorHospitalizacionIds = [];
        let solicitudesPorReferenciaIds = [];

        solicitudes.forEach(el => {
          if (el.origenSolicitudCode === 1) solicitudesPorHospitalizacionIds.push(el.solicitudId);
          if (el.origenSolicitudCode === 2) solicitudesPorReferenciaIds.push(el.solicitudId);
        });

        if (!solicitudesPorHospitalizacionIds.length) solicitudesPorHospitalizacionIds = [0];
        if (!solicitudesPorReferenciaIds.length) solicitudesPorReferenciaIds = [0];

        const solicitudesFromHospitalizacion: any[] = await qr.manager.query(
          fetchPacientesHospitalizados(solicitudesPorHospitalizacionIds)
        );

        const solicitudesFromReferencia: any[] = await qr.manager.query(
          fetchPacientes(solicitudesPorReferenciaIds)
        );

        solicitudesFromHospitalizacion.map(el => {
          el.FECHA_RESERVA = solicitudes.filter(sl => sl.solicitudId === el.OID)[0].createdAt;
          el.CREADA_POR = solicitudes.filter(
            sl => sl.solicitudId === el.OID
          )[0].createdBy.nombreCompleto;
          el.OBSERVACION = solicitudes.filter(sl => sl.solicitudId === el.OID)[0].observacion;
          el.TIPOAISLAMIENTO = solicitudes.filter(
            sl => sl.solicitudId === el.OID
          )[0].tipoAislamiento;
        });

        solicitudesFromReferencia.map(el => {
          el.FECHA_RESERVA = solicitudes.filter(sl => sl.solicitudId === el.OID)[0].createdAt;
          el.CREADA_POR = solicitudes.filter(
            sl => sl.solicitudId === el.OID
          )[0].createdBy.nombreCompleto;
          el.OBSERVACION = solicitudes.filter(sl => sl.solicitudId === el.OID)[0].observacion;
          el.TIPOAISLAMIENTO = solicitudes.filter(
            sl => sl.solicitudId === el.OID
          )[0].tipoAislamiento;
        });

        camasReservadas.map(el => {
          const solicitud = solicitudes.filter(sl => sl.CamaId === el.id);

          if (solicitud.length) {
            if (solicitud[0].origenSolicitudCode === 1) {
              el.reserva = solicitudesFromHospitalizacion.filter(
                (sl: any) => sl.OID === solicitud[0].solicitudId
              )[0];
            }

            if (solicitud[0].origenSolicitudCode === 2) {
              el.reserva = solicitudesFromReferencia.filter(
                (sl: any) => sl.OID === solicitud[0].solicitudId
              )[0];
            }
          }
        });
        camas.push(...response);
      } finally {
        await qr.release();
      }
    }
    return camas;
  }
}
