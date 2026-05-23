import { IsNull } from 'typeorm';
import { EstanciaOrm } from '@orm/hpn';
import { Injectable } from '@nestjs/common';
import { PacienteHospitalizadoRes } from '@hpn/pacientes/application/responses';
import { dataToPacienteHospitalizadoRes } from '../factories';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class FetchPacientesHospitalizadosImpl extends BaseSource {
  async execute(): Promise<PacienteHospitalizadoRes[]> {
    const estanciaRp = this.conn.getRepository(EstanciaOrm);

    const estanciasAbiertas = await estanciaRp.find({
      where: { fechaEgreso: IsNull() },
      relations: [
        'ingreso',
        'cama',
        'cama.subgrupo',
        'ingreso.paciente',
        'ingreso.detalleContrato',
      ],
    });

    const filtered = estanciasAbiertas.filter(ea => ea.ingreso && ea.ingreso.pacienteId);

    return filtered.map(ea => dataToPacienteHospitalizadoRes(ea));
  }
}
