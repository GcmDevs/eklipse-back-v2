import { ESTADOS_ESTANTE, ESTADOS_ESTANTE_VALUES } from './../../domain/types/estado-estante.type';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { AlmacenOrm } from '@orm/inn/productos';
import { CumplimientoEstadisticaRes } from '@farmacia/inn-ciclico/application/responses';
import { UsuarioOrm } from '@orm/gen';
import { UsuarioBasicoRes } from '@common/application/responses';

@Injectable()
export class EstadisticasImpl extends BaseSource {
  public async execute(): Promise<CumplimientoEstadisticaRes> {
    try {
      const almacenRp = this.conn.getRepository(AlmacenOrm);
      const usuarioRp = this.conn.getRepository(UsuarioOrm);

      const now = new Date();

      let almacenes = await almacenRp.find({
        relations: [
          'estantes',
          'estantes.ultimaVerificacion',
          'estantes.ultimaVerificacion.reportes',
          'estantes.ultimaVerificacion.reportes.producto',
        ],
      });
      almacenes = almacenes.filter(a => a.estantes.length);

      const estadisticaAlmacen: CumplimientoEstadisticaRes = {
        porcCumplimiento: 0,
        almacenes: [],
      };

      for (let i = 0; i < almacenes.length; i++) {
        const almacen = almacenes[i];
        const estantes = almacen.estantes;
        let verificados = 0;
        let contados = 0;
        let sinContar = 0;
        const totalEstantes = estantes.length;

        const estantesProcesados = await Promise.all(
          estantes.map(async e => {
            let porcFaltantes = '';
            let porcSobrantes = '';
            let usuario: UsuarioOrm;

            if (e.ultimaVerificacion && e.ultimaVerificacion.verificadoPorId !== null) {
              usuario = await usuarioRp.findOne({
                where: { id: e.ultimaVerificacion.verificadoPorId },
              });
            }

            const fechaUltmVerificacion = e?.ultimaVerificacion?.fechaVerificacion;
            const fechaVerificacion = new Date(fechaUltmVerificacion);
            const milisegundos = e.minutosVerificacionValida * 60 * 1000;

            let estadoEstante = ESTADOS_ESTANTE.SIN_CONTEO.getCode();
            const lastVerificacionIsValid =
              e.ultimaVerificacion &&
              now.getTime() - e.ultimaVerificacion.fechaCreacion.getTime() < milisegundos;
            const hasFechaVerificacion =
              e.ultimaVerificacion && e.ultimaVerificacion.fechaVerificacion;

            if (e.ultimaVerificacion) {
              if (lastVerificacionIsValid) {
                if (hasFechaVerificacion) {
                  estadoEstante = ESTADOS_ESTANTE.VERIFICADO.getCode();
                  verificados++;
                } else {
                  estadoEstante = ESTADOS_ESTANTE.SIN_VERIFICACION.getCode();
                  contados++;
                }
              } else sinContar++;
            } else sinContar++;

            const stockContado = e?.ultimaVerificacion?.reportes.reduce(
              (acum, r) => acum + r.stock,
              0
            );
            const stockReal = e?.ultimaVerificacion?.reportes.reduce(
              (acum, p) => acum + p.dimStock,
              0
            );

            if (stockContado && stockReal) {
              if (stockReal > stockContado) {
                const faltantes = stockReal - stockContado;
                porcFaltantes = Math.abs((faltantes / stockReal) * 100).toFixed(2);
              } else {
                const sobrantes = stockReal - stockContado;
                porcSobrantes = Math.abs((sobrantes / stockContado) * 100).toFixed(2);
              }
            }

            const responsable = new UsuarioBasicoRes();
            responsable.cedula = usuario ? usuario.cedula : null;
            responsable.nombreCompleto = usuario ? usuario.nombreCompleto : null;

            const frecuenciaDias = e.minutosVerificacionValida / 60 / 24;

            return {
              id: e.id,
              nombre: e.nombre,
              frecuenciaConteo:
                frecuenciaDias > 1 ? `${frecuenciaDias} dias` : `${frecuenciaDias} dia`,
              fechaUltimaVerificacion: fechaVerificacion || null,
              porcFaltantes: Number(porcFaltantes),
              porcSobrantes: Number(porcSobrantes),
              responsable,
              estado: estadoEstante,
            };
          })
        );

        const porcVerificados =
          totalEstantes > 0 ? Math.round((verificados / totalEstantes) * 100) : 0;

        estadisticaAlmacen.almacenes.push({
          id: almacen.id,
          nombre: almacen.nombre,
          porcEstantesVerificados: porcVerificados,
          estantesContados: contados,
          estantesSinContar: sinContar,
          estantes: estantesProcesados,
        });

        let almacenesVerificados = 0;
        estadisticaAlmacen.almacenes.forEach(a => {
          if (a.porcEstantesVerificados === 100) almacenesVerificados++;
        });

        const porcCumplimiento = Math.round(
          (almacenesVerificados / almacenes.length) * 100
        ).toFixed(2);

        estadisticaAlmacen.porcCumplimiento = Number(porcCumplimiento);
      }
      return estadisticaAlmacen;

      // for (let i = 0; i < almacenes.length; i++) {
      //   const almacen = almacenes[i];
      //   const estadisticaAlmacen: EstGenAlmacenRes = {
      //     almacen: { id: almacen.id, codigo: almacen.codigo, nombre: almacen.nombre },
      //     total: almacen.estantes.length,
      //     totalSinContar: 0,
      //     totalContados: 0,
      //     totalVerificados: 0,
      //     percTotalSinContar: 0,
      //     percTotalContados: 0,
      //     percTotalVerificados: 0,
      //     estantesConErrores: [],
      //     estantesVerificables: [],
      //   };

      //   for (let j = 0; j < almacen.estantes.length; j++) {
      //     const estante = almacen.estantes[j];

      //     const milisegundos = estante.minutosVerificacionValida * 60 * 1000;

      //     const lastVerificacionIsValid =
      //       estante.ultimaVerificacion &&
      //       now.getTime() - estante.ultimaVerificacion.fechaCreacion.getTime() < milisegundos;

      //     const hasFechaVerificacion =
      //       estante.ultimaVerificacion && estante.ultimaVerificacion.fechaVerificacion;

      //     if (estante.ultimaVerificacion) {
      //       if (lastVerificacionIsValid) {
      //         if (hasFechaVerificacion) estadisticaAlmacen.totalVerificados++;
      //         else estadisticaAlmacen.totalContados++;
      //       } else estadisticaAlmacen.totalSinContar++;
      //     } else estadisticaAlmacen.totalSinContar++;

      //     if (estante.ultimaVerificacion && !estante.ultimaVerificacion.fechaVerificacion) {
      //       if (lastVerificacionIsValid) {
      //         const estanteRevisado: EstGenDifMayPercContRes = {
      //           estante: {
      //             id: estante.id,
      //             nombre: estante.nombre,
      //             tipo: tipoEstanteTypeFactory(estante.tipoCode),
      //           },
      //           diferenciasMayoresPercent: [],
      //         };
      //         estante.ultimaVerificacion.reportes.forEach(rpt => {
      //           const diffInPrc = +((rpt.stock * 100) / rpt.dimStock - 100).toFixed(2);
      //           if (diffInPrc > 1 || diffInPrc < -1) {
      //             const addTodifMayPerc = new EstGenDifMayPercRes();
      //             addTodifMayPerc.cantReportada = rpt.stock;
      //             addTodifMayPerc.cantStock = rpt.dimStock;
      //             addTodifMayPerc.porcDiff = diffInPrc < 0 ? diffInPrc * -1 : diffInPrc;
      //             addTodifMayPerc.producto = {
      //               id: rpt.producto.id,
      //               codigo: rpt.producto.codigo,
      //               nombre: rpt.producto.descripcion,
      //             };
      //             estanteRevisado.diferenciasMayoresPercent.push(addTodifMayPerc);
      //           }
      //         });
      //         if (estanteRevisado.diferenciasMayoresPercent.length) {
      //           estadisticaAlmacen.estantesConErrores.push(estanteRevisado);
      //         } else {
      //           delete estanteRevisado.diferenciasMayoresPercent;
      //           estadisticaAlmacen.estantesVerificables.push(estanteRevisado);
      //         }
      //       }
      //     }
      //   }

      //   estadisticaGeneral.total +=
      //     estadisticaAlmacen.totalContados +
      //     estadisticaAlmacen.totalSinContar +
      //     estadisticaAlmacen.totalVerificados;

      //   estadisticaGeneral.totalContados += estadisticaAlmacen.totalContados;
      //   estadisticaGeneral.totalSinContar += estadisticaAlmacen.totalSinContar;
      //   estadisticaGeneral.totalVerificados += estadisticaAlmacen.totalVerificados;
      //   estadisticaGeneral.almacenes.push(estadisticaAlmacen);
      // }

      // estadisticaGeneral.percTotalContados = +(
      //   (estadisticaGeneral.totalContados * 100) /
      //   estadisticaGeneral.total
      // ).toFixed(2);

      // estadisticaGeneral.percTotalSinContar = +(
      //   (estadisticaGeneral.totalSinContar * 100) /
      //   estadisticaGeneral.total
      // ).toFixed(2);

      // estadisticaGeneral.percTotalVerificados = +(
      //   (estadisticaGeneral.totalVerificados * 100) /
      //   estadisticaGeneral.total
      // ).toFixed(2);

      // estadisticaGeneral.almacenes.map(a => {
      //   a.percTotalSinContar = +((a.totalSinContar * 100) / a.total).toFixed(2);
      //   a.percTotalContados = +((a.totalContados * 100) / a.total).toFixed(2);
      //   a.percTotalVerificados = +((a.totalVerificados * 100) / a.total).toFixed(2);
      // });

      // const result = new EstadisticaRes();
      // result.general = estadisticaGeneral;

      // return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
