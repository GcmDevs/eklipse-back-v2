import { BadRequestException, Injectable } from '@nestjs/common';
import { SOLICITUDES_RECHAZADAS_ESTADOS_CODES } from '@inn/lgc/ctc/application/constants';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { CentralComprasSource } from '@inn/lgc/ctc/infrastructure/base';
import { AprobacionSolicitudByGerenteDto } from '@inn/lgc/ctc/presentation/dtos';
import { CambioEstadoOrm, SolicitudOrm } from '@inn/lgc/ctc/orm/inn/central-compras';
import { gcmContextFactory } from '@common/domain/types';
import { UsuarioOrm } from '@inn/lgc/ctc/orm/gen';

@Injectable()
export class AprobacionGerenteImpl extends CentralComprasSource {
  public async execute(payload: AprobacionSolicitudByGerenteDto) {
    const qr = this.dynamicQR(gcmContextFactory(payload.contextCode));
    await qr.connect();
    await qr.startTransaction();
    try {
      const cambioEstadoRp = qr.manager.getRepository(CambioEstadoOrm);
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const usuarioRp = qr.manager.getRepository(UsuarioOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: payload.solicitudId } });
      const usuario = await usuarioRp.findOne({ where: { cedula: this.auth.user.document } });

      const estados = await cambioEstadoRp.find({
        where: { solicitudId: payload.solicitudId },
        order: { id: 'DESC' },
      });

      const rechazosCodes = SOLICITUDES_RECHAZADAS_ESTADOS_CODES;

      const rechazos = estados.filter(el => rechazosCodes.indexOf(el.tipoCode) >= 0);

      if (!usuario) throw new Error('No tiene usuario en esta clinica');
      if (!solicitud) throw new Error('No existe esta solicitud');
      if (rechazos.length >= 3) throw new Error('La solicitud ya ha sido rechazada 3 veces');
      if (estados.length) {
        if (rechazosCodes.indexOf(estados[0].tipoCode) >= 0) {
          throw new Error('Solicitud fue rechazada previamente o no ha sido reactivada');
        }
        if ([ESTADOS.SOL_APROBADA.getCode()].indexOf(estados[0].tipoCode) >= 0) {
          throw new Error('Solicitud fue aprobada previamente');
        }
      }

      const estado = payload.isAprobado
        ? ESTADOS.SOL_APROBADA
        : rechazos.length >= 2
          ? ESTADOS.SOL_RECHAZO_DEFINITIVO
          : ESTADOS.SOL_RECHAZO_TEMPORAL;

      const estadoEspecifico = payload.isAprobado
        ? ESTADOS_ESPECIFICOS.SOL_APROBADA
        : ESTADOS_ESPECIFICOS.SOL_NO_APROBADA;

      solicitud.prioridadCode = payload.prioridadCode;
      solicitud.estadoCode = estado.getCode();

      await solicitudRp.save(solicitud);

      await this.createCambioEstado(qr, {
        estado,
        estadoEspecifico,
        informacionAdicional: payload.observaciones,
        solicitud,
      });

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
