import { BadRequestException, Injectable } from '@nestjs/common';
import { CentralComprasSource } from '@inn/central-compras/infrastructure/base';
import { UpdateSolicitudColaboradorDto } from '@inn/central-compras/presentation/dtos';
import { ROL_DEPENDIENTES_CAN_APROBAR_SOLICITUDES_CODES } from '@inn/central-compras/application/constants';
import { ESTADOS, ESTADOS_ESPECIFICOS } from '@ctypes/inn/central-compras/solicitudes';
import { CreateCambioEstadoI } from '@inn/central-compras/application/interfaces';
import { gcmContextFactory } from '@common/domain/types';
import { SolicitudOrm } from '@orm/inn/central-compras';
import { UsuarioOrm } from '@orm/gen';

@Injectable()
export class UpdateSolicitudColaboradorImpl extends CentralComprasSource {
  public async execute(payload: UpdateSolicitudColaboradorDto) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    await qr.startTransaction();

    try {
      const solicitudRp = qr.manager.getRepository(SolicitudOrm);
      const userRp = qr.manager.getRepository(UsuarioOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: payload.solicitudId } });
      const userFromDDBB = await userRp.findOne({ where: { cedula: this.auth.user.document } });

      if (!solicitud) throw new Error('No existe solicitud con este id en este centro');
      if (!userFromDDBB) throw new Error('No tienes usuario en este centro');

      const depsByUser = await this.fetchUserDependences(userFromDDBB.id, ctx);
      const rolDepend = depsByUser.filter(dp => dp.dependence.id === solicitud.dependenciaId);

      if (!rolDepend.length) throw new Error('Usted no tiene relación con esta dependencia');

      if (ROL_DEPENDIENTES_CAN_APROBAR_SOLICITUDES_CODES.indexOf(rolDepend[0].role.code) < 0) {
        throw new Error('Usted no puede aprobar solicitudes');
      }

      const plCambioEstado: CreateCambioEstadoI = {
        solicitud,
        estado: ESTADOS.SOL_REGISTRADA,
        estadoEspecifico: ESTADOS_ESPECIFICOS.SOL_REGISTRADA,
        informacionAdicional: payload.observaciones,
      };
      solicitud.estadoCode = ESTADOS.SOL_REGISTRADA.getCode();

      if (!payload.isAprobado) {
        plCambioEstado.estado = ESTADOS.SOL_RECHAZO_DEFINITIVO;
        plCambioEstado.estadoEspecifico = ESTADOS_ESPECIFICOS.SOL_DECLI_JEF_DEPEND;
        solicitud.estadoCode = ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode();
      }

      await this.createCambioEstado(qr, plCambioEstado);
      await solicitudRp.save(solicitud);
      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
