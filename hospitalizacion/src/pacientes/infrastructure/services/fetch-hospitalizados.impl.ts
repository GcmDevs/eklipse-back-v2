import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { EstanciaOrm } from '@orm/hpn';
import { IsNull } from 'typeorm';
import { dataToPacienteHospitalizadoRes } from '../factories';
import { PacienteHospitalizadoRes } from '@hpn/pacientes/application/responses';

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
