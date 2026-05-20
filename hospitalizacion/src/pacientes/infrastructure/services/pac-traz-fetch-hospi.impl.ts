import { In, IsNull } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { PacienteTrazadorRes } from '@hpn/pacientes/application/responses';
import { PacientePreAltaOrm, PacTrazEncuestaOrm } from '../orm/pacientes-trazadores';
import { dataToPacienteTrazadorRes } from '../factories';
import { EstanciaOrm } from '@orm/hpn';
import { ultimoDiagnosticoPrincipalByIngresoIdQuery, UltimoDiagnosticoRes } from '../queries';

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

    const ultimosDiagnosticos: UltimoDiagnosticoRes[] = await this.conn.query(
      ultimoDiagnosticoPrincipalByIngresoIdQuery(filteredByPacientePreAlta.map(ea => ea.ingresoId))
    );

    return filteredByPacientePreAlta.map(ea =>
      dataToPacienteTrazadorRes({
        estancia: ea,
        pacientePreAlta: pacientesPreAlta.find(p => p.ingresoId === ea.ingresoId),
        encuesta: encuestas.find(e => e.ingresoId === ea.ingresoId),
        ultimoDiagnostico: ultimosDiagnosticos.find(d => d.ingresoId === ea.ingresoId),
      })
    );
  }
}
