import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { PacienteExternoOrm, SolicitudOrm } from '@inn/orm/inn/central-mezclas';
import { dataToSolicitudRes } from '../factories';
import { UsuarioExternoOrm, UsuarioOrm } from '@inn/orm/gen';
import { Between, In } from 'typeorm';

@Injectable()
export class FetchSolicitudesImpl extends BaseSource {
  async execute(fechaInicio: Date, fechaFin: Date) {
    const solicitudRp = this.conn.getRepository(SolicitudOrm);
    const pacienteExternoRp = this.conn.getRepository(PacienteExternoOrm);
    const usuExtRp = this.ekConn.getRepository(UsuarioExternoOrm);
    const usLclRp = this.conn.getRepository(UsuarioOrm);

    const solicitudes = await solicitudRp.find({
      where: { fechaCreacion: Between(fechaInicio, fechaFin) },
      relations: [
        'usuarioResponsable',
        'seleccion',
        'seleccion.medicamento',
        'nutricionParenteral',
      ],
    });

    const usuariosExternosIds: number[] = [0];
    const usuariosLocalesIds: number[] = [0];

    solicitudes.forEach(s => {
      if (!s.isExterno) usuariosLocalesIds.push(s.usuarioExternoId);
      else usuariosExternosIds.push(s.usuarioExternoId);
    });

    const pacientesExternosIds = solicitudes.map(sol => sol.pacienteExternoId);

    const usuariosExternos = await usuExtRp.find({ where: { id: In(usuariosExternosIds) } });
    const usuariosLocales = await usLclRp.find({ where: { id: In(usuariosLocalesIds) } });
    const pacientesExternos = await pacienteExternoRp.find({
      where: { id: In(pacientesExternosIds) },
      relations: ['paciente', 'estancia', 'estancia.cama'],
    });

    return solicitudes.map(s =>
      dataToSolicitudRes(
        s,
        s.isExterno
          ? usuariosExternos.find(u => u.id === s.usuarioExternoId)
          : usuariosLocales.find(u => u.id === s.usuarioExternoId),
        pacientesExternos.find(u => u.id === s.pacienteExternoId)
      )
    );
  }
}
