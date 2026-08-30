import { Injectable } from '@nestjs/common';
import { ServicioTecnicoBaseSource } from '../../bases';
import { SolicitudServicioTecnicoOrm } from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { isNull, orderBy } from 'lodash';
import {
  ESTADO_AFNITEM_SOL_SER_TEC,
  estadoAfnItemSolSerTecTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { UsuarioOrm } from '@inn/lgc/afn/orm/gen';
import { TimerServices } from '@common/application/services';

export interface DataI {
  totalOportunidad: string;
  historico: HistoricoItemI[];
}

export interface HistoricoItemI {
  isNota: boolean;
  nota?: string;
  descripcion: string;
  fecha: Date;
  usuario: {
    nombreCompleto: string;
  };
  oportunidad: string;
}

@Injectable()
export class FetchHistoricoSolicitudServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async execute(solicitudId: number) {
    try {
      const solicitudRp = this.conn.getRepository(SolicitudServicioTecnicoOrm);
      const usuarioRp = this.conn.getRepository(UsuarioOrm);

      const solicitud = await solicitudRp.findOne({
        where: { id: solicitudId },
        relations: ['creadoPor', 'notas', 'notas.creadoPor'],
      });

      const historico: HistoricoItemI[] = [];
      let msInProceso = 0;

      historico.push({
        isNota: false,
        descripcion: `Solicitud creada`,
        fecha: solicitud.fechaCreacion,
        usuario: {
          nombreCompleto: solicitud.creadoPor.nombreCompleto,
        },
        oportunidad: 'Inicio del conteo',
      });

      solicitud.notas = orderBy(solicitud.notas, 'fechaCreacion', 'asc');

      let lastTime = solicitud.fechaCreacion;

      const estadosCode = [
        ESTADO_AFNITEM_SOL_SER_TEC.ASIGNADA.getCode(),
        ESTADO_AFNITEM_SOL_SER_TEC.REASIGNADA.getCode(),
      ];

      for (let index = 0; index < solicitud.notas.length; index++) {
        const n = solicitud.notas[index];

        if (n.estadoCode && isNull(n.isAprobado)) {
          let usuarioAsignado: UsuarioOrm;
          if (n.nota) {
            const index = n.nota.indexOf('sltec');
            if (index !== -1) {
              n.nota = n.nota.slice(0, index);
            }
          }

          if (estadosCode.includes(n.estadoCode) && !isNaN(+n.nota)) {
            usuarioAsignado = await usuarioRp.findOne({ where: { id: +n.nota } });
          }
          historico.push({
            isNota: false,
            descripcion: estadosCode.includes(n.estadoCode)
              ? `La solicitud fue ${estadoAfnItemSolSerTecTypeFactory(
                  n.estadoCode
                ).getForHumans()} a ${
                  usuarioAsignado ? usuarioAsignado.nombreCompleto : 'NO DEFINIDO'
                }`
              : `El estado de la solicitud es ${estadoAfnItemSolSerTecTypeFactory(
                  n.estadoCode
                ).getForHumans()}`,
            fecha: n.fechaCreacion,
            usuario: {
              nombreCompleto: n.creadoPor.nombreCompleto,
            },
            oportunidad: TimerServices.timeFromNow(lastTime, {
              from: n.fechaCreacion,
              upd: false,
              ago: false,
            }) as string,
          });
        } else {
          historico.push({
            isNota: true,
            descripcion: `${
              isNull(n.isAprobado) ? 'nota agregada' : n.isAprobado ? 'APROBADA' : 'RECHAZADA'
            }`,
            fecha: n.fechaCreacion,
            usuario: {
              nombreCompleto: n.creadoPor.nombreCompleto,
            },
            nota: n.nota,
            oportunidad: TimerServices.timeFromNow(lastTime, {
              from: n.fechaCreacion,
              upd: false,
              ago: false,
            }) as string,
          });
        }
        lastTime = n.fechaCreacion;
      }

      return { totalOportunidad: `${msInProceso}`, historico };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
