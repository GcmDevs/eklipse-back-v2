import { BaseSource } from '@common/infrastructure/services';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';
import { GuardarGestorQxDto } from '@hpn/boleta-quirurgica/presentation/dto';
import { Injectable } from '@nestjs/common';
import {
  BoletaQuirurgicaAuditoriaOrm,
  BoletaQuirurgicaGestorQxOrm,
  BoletaQuirurgicaMaosOrm,
  BoletaQuirurgicaProgramacionOrm,
} from '../orm';
import { trim } from '@hpn/boleta-quirurgica/shared/utils/utils';

@Injectable()
export class GestorQxBoletaQuirurgicaImpl extends BaseSource {
  public async execute(body: GuardarGestorQxDto) {
    let transactionStarted = false;

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const gestorQxRp = this.qr.manager.getRepository(BoletaQuirurgicaGestorQxOrm);
      const auditoriaRp = this.qr.manager.getRepository(BoletaQuirurgicaAuditoriaOrm);
      const programacionRp = this.qr.manager.getRepository(BoletaQuirurgicaProgramacionOrm);
      const maosRp = this.qr.manager.getRepository(BoletaQuirurgicaMaosOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const gestorQx = await gestorQxRp.findOne({ where });
      const auditoria = await auditoriaRp.findOne({ where });
      const gestorQxPayload = {
        otrasValoraciones: trim(body.otrasValoraciones),
        observacion: trim(body.observacion),
        estadoAutorizacion: body.estadoAutorizacion,
      };
      const auditoriaPayload = {
        pendiente1: trim(body.pendiente1),
        pendiente2: trim(body.pendiente2),
        pendiente3: trim(body.pendiente3),
        pendiente4: trim(body.pendiente4),
      };

      if (!gestorQx) {
        await gestorQxRp.save(
          gestorQxRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaRecepcion: new Date(),
            ...gestorQxPayload,
          })
        );
      } else {
        await gestorQxRp.update(where, gestorQxPayload);
      }

      if (typeof body.reqMaos === 'boolean') {
        const reqMaos = body.reqMaos ? 'SI' : 'NO';
        const estado2Maos = body.reqMaos ? '' : 'SI';
        const maos = await maosRp.findOne({ where });
        const programacion = await programacionRp.findOne({ where });

        if (!maos) {
          await maosRp.save(
            maosRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              fechaEntrega: null,
              maosSolicitado: '',
              casaComercial: '',
              estadoMaos: '',
              estado2Maos,
              existencia: '',
            })
          );
        } else {
          await maosRp.update(where, {
            estado2Maos,
          });
        }

        if (!programacion) {
          await programacionRp.save(
            programacionRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              fechaRecepcion: new Date(),
              fechaProgramacion: new Date(),
              programada: '',
              sede: '',
              estado: '',
              reqMaos,
              observacion: '',
              estadoProg: '',
            })
          );
        } else {
          await programacionRp.update(where, {
            reqMaos,
          });
        }
      }

      if (!auditoria) {
        await auditoriaRp.save(
          auditoriaRp.create({
            ingreso: body.ingreso,
            folio: body.folio,
            fechaCaptacion: new Date(),
            municipio: '',
            tipo: '',
            autorizado: '',
            pendiente5: '',
            pendiente6: '',
            pendiente7: '',
            servicio: '',
            observacion: '',
            fechaFin: null,
            cambioCups: '',
            usuario: '',
            ...auditoriaPayload,
          })
        );
      } else {
        await auditoriaRp.update(where, auditoriaPayload);
      }

      await this.qr.commitTransaction();
      return { created: !gestorQx || !auditoria, updated: !!gestorQx && !!auditoria };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando gestor qx de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
