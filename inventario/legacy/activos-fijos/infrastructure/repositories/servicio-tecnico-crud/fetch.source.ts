import { Injectable } from '@nestjs/common';
import { Between, In, Not } from 'typeorm';
import { AfnDataSoliSerTecRes } from '@inn/lgc/afn/application/responses';
import {
  SSTItemOrm,
  SolicitudServicioTecnicoOrm,
  UsuarioTipoServicioTecnicoOrm,
} from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { afnSoliSerTecOrmToAfnSoliSerTecResFactory } from '../../factories';
import {
  AFNTIPO_SER_REC_TEC__ASIGNAR__,
  AFNTIPO_SER_REC_TEC__ATCSNA,
  AFNTIPO_SER_REC_TEC__SEEALL,
  AFNTIPO_SER_REC_TEC__TODOS__,
  ESTADO_AFNITEM_SOL_SER_TEC,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { ServicioTecnicoBaseSource } from '../../bases';

@Injectable()
export class FetchSolicitudServicioTecnicoSource extends ServicioTecnicoBaseSource {
  public async execute(
    onlyMisSolicitudes: boolean,
    inicio: Date,
    final: Date
  ): Promise<AfnDataSoliSerTecRes> {
    let misServiciosTecnicos: UsuarioTipoServicioTecnicoOrm[] = [];
    let incluyeTodosLosServiciosTecnicos = false;
    let puedeAsignarCasos = false;
    let puedeAtenderCasosNoAsignados = false;
    let puedeVerTodosLosCasos = false;
    try {
      if (!onlyMisSolicitudes) {
        const usuSerTecRp = this.conn.getRepository(UsuarioTipoServicioTecnicoOrm);

        misServiciosTecnicos = await usuSerTecRp.find({ where: { usuarioId: this.auth.id } });

        if (!misServiciosTecnicos.length) throw new Error('Usted no es tecnico');

        misServiciosTecnicos.forEach(s => {
          if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__TODOS__.getCode()) {
            incluyeTodosLosServiciosTecnicos = true;
          }
          if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__ATCSNA.getCode()) {
            puedeAtenderCasosNoAsignados = true;
          }
          if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__ASIGNAR__.getCode()) {
            puedeAsignarCasos = true;
          }
          if (s.tipoServicioTecnicoCode === AFNTIPO_SER_REC_TEC__SEEALL.getCode()) {
            puedeVerTodosLosCasos = true;
          }
        });
      }

      const soliSerTecRp = this.conn.getRepository(SolicitudServicioTecnicoOrm);

      const tipoServicioTecnicoCode = !onlyMisSolicitudes
        ? incluyeTodosLosServiciosTecnicos
          ? undefined
          : In(misServiciosTecnicos.map(s => s.tipoServicioTecnicoCode))
        : undefined;

      const creadoPorId = onlyMisSolicitudes ? this.auth.id : undefined;

      const atendidoPorId = onlyMisSolicitudes
        ? undefined
        : puedeVerTodosLosCasos
          ? undefined
          : puedeAtenderCasosNoAsignados
            ? undefined
            : this.auth.id;

      let soliSerTec = await soliSerTecRp.find({
        where:
          inicio && final
            ? {
                fechaCreacion: Between(inicio, final),
                creadoPorId,
                detalle: {
                  tipoServicioTecnicoCode,
                  atendidoPorId,
                },
              }
            : {
                creadoPorId,
                detalle: {
                  estadoCode: Not(
                    In(
                      onlyMisSolicitudes
                        ? [ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode()]
                        : [
                            ESTADO_AFNITEM_SOL_SER_TEC.APROBADA.getCode(),
                            ESTADO_AFNITEM_SOL_SER_TEC.FINALIZADA.getCode(),
                            ESTADO_AFNITEM_SOL_SER_TEC.ERRADA.getCode(),
                          ]
                    )
                  ),
                  tipoServicioTecnicoCode,
                  atendidoPorId,
                },
              },
        relations: [
          'centro',
          'dependencia',
          'creadoPor',
          'detalle',
          'detalle.atendidoPor',
          'detalle.notas',
          'detalle.notas.creadoPor',
          'detalle.activo',
          'detalle.activo.producto',
          'detalle.activo.responsable',
          'detalle.ingreso',
          'detalle.ingreso.paciente',
          'detalle.ingreso.contrato',
          'detalle.ingreso.contrato.tercero',
        ],
      });

      soliSerTec.map(s => {
        s.detalle.map(d => {
          if (d.notas) {
            d.notas = d.notas.filter(n => n.isNotaPrincipal !== null);
            d.notas.map(n => {
              if (n.isAprobado !== null) {
                if (!d.isAceptadaByAutor) {
                  if (n.isAprobado) d.isAceptadaByAutor = true;
                  else d.isAceptadaByAutor = false;
                }
              }
            });
          }
        });
      });

      if (!onlyMisSolicitudes) {
        const mapped: SolicitudServicioTecnicoOrm[] = [];
        soliSerTec.forEach(s => {
          const detTemp: SSTItemOrm[] = [];
          s.detalle.forEach(d => {
            if (puedeVerTodosLosCasos) detTemp.push(d);
            else if (!d.atendidoPorId) detTemp.push(d);
            else if (d.atendidoPorId === this.auth.id) detTemp.push(d);
          });
          s.detalle = detTemp;
          if (s.detalle.length) mapped.push(s);
        });
        soliSerTec = mapped;
      }

      const data = soliSerTec.map(r => {
        if (r.notas) {
          r.notas.map(n => (n = this.refactorizeNotas(n)));
        }
        r.detalle.map(d => {
          d.notas.forEach(n => (n = this.refactorizeNotas(n)));
        });
        return afnSoliSerTecOrmToAfnSoliSerTecResFactory(r, this.auth.id);
      });

      return {
        canAsignarCasos: puedeAsignarCasos,
        incluyeTodosLosServiciosTecnicos,
        puedeAsignarCasos,
        puedeAtenderCasosNoAsignados,
        puedeVerTodosLosCasos,
        data,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
