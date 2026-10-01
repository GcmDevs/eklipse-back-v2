import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EkEmpleadoOrm } from '../orm';
import { BaseSource } from '@common/infrastructure/services';
import { UsuarioOrm } from '../../../../orm/general';
import { TipoEmpleadoCode } from '../../domain/types';
import { GCM_CONTEXTS } from '@common/domain/types';
import { uniqBy } from 'lodash';
import { GCM_HCN_GTC_CONTEXTOS } from 'hpn/older-apps/gestion-clinica/v2/gestion-clinica.queries';

@Injectable()
export class EmpleadoByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string, tipoCode: TipoEmpleadoCode) {
    const conn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);

    const empleadoRp = conn.getRepository(EkEmpleadoOrm);

    const empleados = await empleadoRp.find({
      where: [
        { documento: Like(`%${pattern}%`), tipoCode },
        { nombre: Like(`%${pattern}%`), tipoCode },
      ],
      take: 5,
    });

    if (empleados.length)
      return empleados.map(e => {
        return {
          nombre: e.nombre,
          documento: e.documento,
          telefono: e.telefono,
        };
      });

    const allUsuarios: UsuarioOrm[] = [];

    for (let index = 0; index < GCM_HCN_GTC_CONTEXTOS.length; index++) {
      const element = GCM_HCN_GTC_CONTEXTOS[index];
      const qr = this.dynamicQR(element);
      await qr.connect();
      try {
        const usuarioRp = qr.manager.getRepository(UsuarioOrm);

        const usuarios = await usuarioRp.find({
          where: [{ cedula: Like(`%${pattern}%`) }, { nombreCompleto: Like(`%${pattern}%`) }],
          take: 5,
        });

        allUsuarios.push(...usuarios);
      } catch (error) {
        throw new Error(error.message);
      } finally {
        await qr.release();
      }
    }

    const usuariosFiltered = uniqBy(allUsuarios, 'cedula');

    const data = usuariosFiltered.map(u => {
      return {
        nombre: u.nombreCompleto,
        documento: u.cedula,
        telefono: null,
      };
    });

    return data;
  }
}
