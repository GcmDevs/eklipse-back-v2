import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { AsignacionVehiculoOrm, VehiculoOrm } from '@orm/gcn';

@Injectable()
export class VehiculoByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string) {
    const conn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);

    const vehiculoRp = conn.getRepository(VehiculoOrm);
    const vehiculos = await vehiculoRp.find({
      where: [{ placa: Like(`%${pattern}%`) }],
      take: 5,
    });
    return vehiculos;
  }

  public async fetchByPatternAndEmpleados(pattern: string) {
    const vehiculoRp = this.conn.getRepository(VehiculoOrm);
    const asignacionRp = this.conn.getRepository(AsignacionVehiculoOrm);
    const vehiculos = await vehiculoRp.find({
      where: [{ placa: Like(`%${pattern}%`) }],
      take: 5,
      relations: [
        'asignaciones',
        'asignaciones.auxiliar',
        'asignaciones.auxiliar.usuario',
        'asignaciones.conductor',
        'asignaciones.conductor.usuario',
      ],
    });

    vehiculos.map(value => {
      value.asignaciones.map(asig => {
        delete asig.auxiliarId;
        delete asig.conductorId;
        delete asig.fechaFin;
        delete asig.isActivo;
        delete asig.tipoTurno;
        if (asig.conductor.usuarioId === null) {
          delete asig.conductor.usuario;
          delete asig.conductor.usuarioId;
        } else {
          asig.conductor.documento = asig.conductor.usuario.cedula;
          asig.conductor.nombre = asig.conductor.usuario.nombreCompleto;
          asig.conductor.isUsuario = true;
          delete asig.conductor.usuario;
        }
        if (asig.auxiliar.usuarioId === null) {
          delete asig.auxiliar.usuario;
          delete asig.auxiliar.usuarioId;
        } else {
          asig.auxiliar.documento = asig.auxiliar.usuario.cedula;
          asig.auxiliar.nombre = asig.auxiliar.usuario.nombreCompleto;
          asig.auxiliar.isUsuario = true;
          delete asig.auxiliar.usuario;
        }

        delete asig.auxiliar;
        delete asig.conductor;
      });
    });

    return vehiculos;
  }
}
