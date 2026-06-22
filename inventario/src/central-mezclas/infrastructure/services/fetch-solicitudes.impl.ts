import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { PacienteExternoOrm, SolicitudOrm } from '@inn/orm/inn/central-mezclas';
import { dataToSolicitudRes } from '../factories';
import { UsuarioExternoOrm } from '@inn/orm/gen';
import { Between, In } from 'typeorm';

@Injectable()
export class FetchSolicitudesImpl extends BaseSource {
  async execute(fechaInicio: Date, fechaFin: Date) {
    const solicitudRp = this.conn.getRepository(SolicitudOrm);
    const pacienteExternoRp = this.conn.getRepository(PacienteExternoOrm);
    const usuExtRp = this.conn.getRepository(UsuarioExternoOrm);

    const solicitudes = await solicitudRp.find({
      where: { fechaCreacion: Between(fechaInicio, fechaFin) },
      relations: ['usuarioResponsable', 'seleccion', 'seleccion.medicamento'],
    });

    const usuariosExternosIds = solicitudes.map(sol => sol.usuarioExternoId);
    const pacientesExternosIds = solicitudes.map(sol => sol.pacienteExternoId);

    const usuariosExternos = await usuExtRp.find({ where: { id: In(usuariosExternosIds) } });
    const pacientesExternos = await pacienteExternoRp.find({
      where: { id: In(pacientesExternosIds) },
      relations: ['paciente', 'estancia', 'estancia.cama'],
    });

    return solicitudes.map(s =>
      dataToSolicitudRes(
        s,
        usuariosExternos.find(u => u.id === s.usuarioExternoId),
        pacientesExternos.find(u => u.id === s.pacienteExternoId)
      )
    );
  }
}
