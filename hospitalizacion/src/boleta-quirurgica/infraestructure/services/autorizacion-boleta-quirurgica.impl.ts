import { BaseSource } from '@common/infrastructure/services';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';
import { GuardarAutorizacionDto } from '@hpn/boleta-quirurgica/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import {
  BoletaQuirurgicaAuditoriaOrm,
  BoletaQuirurgicaLogOrm,
  BoletaQuirurgicaObservacionOrm,
  BoletaQuirurgicaRegistroOrm,
} from '../orm';
import { trim } from '@hpn/boleta-quirurgica/shared/utils/utils';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class AutorizacionBoletaQuirurgicaImpl extends BaseSource {
  constructor(@Inject(REQUEST) private readonly request: Request) {
    super(request);
  }

  public async execute(body: GuardarAutorizacionDto, ip: string): Promise<any> {
    let transactionStarted = false;
    // const ip = this.getClientIp();

    try {
      await this.qr.connect();
      await this.qr.startTransaction();
      transactionStarted = true;

      const auditoriaRp = this.qr.manager.getRepository(BoletaQuirurgicaAuditoriaOrm);
      const observacionRp = this.qr.manager.getRepository(BoletaQuirurgicaObservacionOrm);
      const registroRp = this.qr.manager.getRepository(BoletaQuirurgicaRegistroOrm);
      const logRp = this.qr.manager.getRepository(BoletaQuirurgicaLogOrm);
      const where = { ingreso: body.ingreso, folio: body.folio };
      const observacion = trim(body.observacion);
      const usuarioLog = trim(this.auth.user.document);
      const autorizacionExistente = await auditoriaRp.findOne({
        where: { ingreso: body.ingreso, folio: body.folio },
      });

      if (!autorizacionExistente) {
        if (observacion) {
          await observacionRp.save(
            observacionRp.create({
              ingreso: body.ingreso,
              folio: body.folio,
              observacion,
              fechaObservacion: new Date(),
              gestor: 'AUTORIZACION',
              usuario: usuarioLog,
            })
          );
        }

        await auditoriaRp.save(
          auditoriaRp.create({
            ingreso: body.ingreso,
            fechaCaptacion: new Date(body.fechaCaptacion),
            municipio: trim(body.municipio),
            tipo: trim(body.tipo),
            autorizado: trim(body.autorizado),
            pendiente1: trim(body.pendiente1),
            pendiente2: trim(body.pendiente2),
            pendiente3: trim(body.pendiente3),
            pendiente4: trim(body.pendiente4),
            pendiente5: trim(body.pendiente5),
            pendiente6: trim(body.pendiente6),
            pendiente7: trim(body.pendiente7),
            servicio: trim(body.servicio),
            observacion,
            fechaFin: new Date(body.fechaGestor),
            cambioCups: '',
            usuario: '',
            folio: body.folio,
          })
        );

        await registroRp.update(where, { estado: 'EN GESTION' });
        await logRp.save(
          logRp.create({
            fecha: new Date(),
            usuario: usuarioLog,
            detalle: 'CAMBIO A ESTADO GESTION',
            modulo: 'AUTORIZACION',
            ingreso: body.ingreso,
            direccionIp: ip,
            host: this.request.hostname,
          })
        );

        await this.qr.commitTransaction();
        return { created: true, updated: false };
      }

      await auditoriaRp.update(where, {
        fechaCaptacion: new Date(body.fechaCaptacion),
        fechaFin: new Date(body.fechaGestor),
        municipio: trim(body.municipio),
        tipo: trim(body.tipo),
        autorizado: trim(body.autorizado),
        pendiente5: trim(body.pendiente5),
        pendiente6: trim(body.pendiente6),
        pendiente7: trim(body.pendiente7),
        servicio: trim(body.servicio),
        observacion,
        cambioCups: trim(body.cambioCups),
        usuario: trim(body.usuarioCambioCups),
      });
      await registroRp.update(where, { estado: trim(body.estado) || 'EN GESTION' });
      await logRp.save(
        logRp.create({
          fecha: new Date(),
          usuario: usuarioLog,
          detalle: 'ACTUALIZA A ESTADO AUDITORIA',
          modulo: 'AUDITORIA',
          ingreso: body.ingreso,
          direccionIp: ip,
          host: this.request.hostname,
        })
      );

      await this.qr.commitTransaction();
      return { created: false, updated: true };
    } catch (error) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throwBoletaQuirurgicaError(error, 'Error guardando autorizacion de boleta quirurgica');
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
