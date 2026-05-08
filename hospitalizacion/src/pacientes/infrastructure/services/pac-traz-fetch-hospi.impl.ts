import { In, IsNull } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { PacienteTrazadorRes } from '@hpn/pacientes/application/responses';
import { PacientePreAltaOrm, PacTrazEncuestaOrm } from '../orm/pacientes-trazadores';
import { dataToPacienteTrazadorRes } from '../factories';
import { EstanciaOrm } from '@orm/hpn';

@Injectable()
export class PacTrazFetchPacientesPreAltaImpl extends BaseSource {
  async execute(): Promise<PacienteTrazadorRes[]> {
    const estanciaRp = this.conn.getRepository(EstanciaOrm);
    const pacientePreAltaRp = this.conn.getRepository(PacientePreAltaOrm);
    const encuestaRp = this.conn.getRepository(PacTrazEncuestaOrm);

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

    const filteredByEstanciaAbierta = estanciasAbiertas.filter(
      ea => ea.ingreso && ea.ingreso.pacienteId
    );

    const ingresoIds = filteredByEstanciaAbierta.map(ea => ea.ingresoId);

    const pacientesPreAlta = await pacientePreAltaRp.find({
      where: { ingresoId: In(ingresoIds) },
    });

    const encuestas = await encuestaRp.find({
      where: { ingresoId: In(ingresoIds) },
    });

    const filteredByPacientePreAlta = filteredByEstanciaAbierta.filter(ea =>
      pacientesPreAlta.some(p => p.ingresoId === ea.ingresoId)
    );

    return filteredByPacientePreAlta.map(ea =>
      dataToPacienteTrazadorRes(
        ea,
        pacientesPreAlta.find(p => p.ingresoId === ea.ingresoId),
        encuestas.find(e => e.ingresoId === ea.ingresoId)
      )
    );
  }
}
