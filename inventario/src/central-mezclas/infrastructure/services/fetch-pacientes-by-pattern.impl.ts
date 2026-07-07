import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { CtMzPacienteRes } from '@inn/central-mezclas/application/responses';
import { dataToPacienteRes } from '../factories';
import { PacienteOrm } from '@inn/orm/gen';
import { In, IsNull, Like } from 'typeorm';
import { IngresoOrm } from '@inn/orm/adn';
import { EstanciaOrm } from '@inn/orm/hpn';

@Injectable()
export class FetchPacientesByPatternImpl extends BaseSource {
  async execute(numDoc: string): Promise<CtMzPacienteRes[]> {
    if (!numDoc?.trim()) throw new Error('El patron de busqueda del paciente es requerido');

    numDoc = numDoc.trim();

    const pacienteRp = this.conn.getRepository(PacienteOrm);
    const ingresoRp = this.conn.getRepository(IngresoOrm);
    const estanciaRp = this.conn.getRepository(EstanciaOrm);

    const pacientes = await pacienteRp.find({
      where: [{ numDoc }],
      order: { nombreCompleto: 'DESC' },
      take: 5,
    });

    for (const paciente of pacientes) {
      const ultimoIngreso = await ingresoRp.findOne({
        where: { pacienteId: paciente.id },
        order: { fechaIngreso: 'DESC' },
      });

      if (ultimoIngreso) {
        const ultimaEstancia = await estanciaRp.findOne({
          where: { ingresoId: ultimoIngreso?.id, fechaEgreso: IsNull() },
          relations: ['cama'],
          order: { fechaIngreso: 'DESC' },
        });

        ultimoIngreso.estancias = ultimaEstancia ? [ultimaEstancia] : [];

        paciente.ingresos = [ultimoIngreso];
      }
    }

    return pacientes.map(dataToPacienteRes);
  }
}
