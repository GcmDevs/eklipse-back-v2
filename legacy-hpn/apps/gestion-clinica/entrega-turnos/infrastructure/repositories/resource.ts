import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { CamaOrm, EstanciaOrm, SubgrupoOrm } from '@orm/temp';
import { FolioOrm, UsuarioOrm } from '@orm/gen';
import { Brackets, In, IsNull, Like, Not } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { newDataToPacientesHopitalizados } from '../factories';
import { EntregaTurnoOrm, PacienteEvolucionOrm } from '@orm/gcn';
import { dataRes } from '@gestion-clinica/entrega-turnos/application/responses';

@Injectable()
export class RecursosImpl extends BaseSource {
  public async fetchIndicacionesMedicasByIngreso(ingresoId: number) {
    await this.verifyEntityExist(TABLE_NAMES.adn.ingresos, ingresoId);

    const folioRp = this.conn.getRepository(FolioOrm);
    const folios = await folioRp.find({
      where: { ingresoId, indicacionMedica: { indicacion: Not(IsNull()) } },
      relations: ['medico', 'indicacionMedica'],
    });

    folios.map(v => {
      delete v.medicoId;
      delete v.indicacionMedicId;
      return {
        id: v.id,
        fecha: v.fecha,
        ingresoId: v.ingresoId,
        medico: v.medico,
        indicacionesMedicas: v.indicacionMedica,
      };
    });

    return folios;
  }

  public async fetchPacientesHpnBySubgrupo(centroId: string, subgrupoCode: string) {
    const estanciaRp = this.conn.getRepository(EstanciaOrm);
    const estancia = await estanciaRp.find({
      where: [{ cama: { centroId, subgrupo: { codigo: subgrupoCode } }, fechaEgreso: IsNull() }],
      relations: [
        'ingreso',
        'ingreso.paciente',
        'ingreso.detalleContrato.contrato',
        'ingreso.especialidad',
        'cama.centro',
        'cama.grupo',
        'cama.subgrupo',
      ],
      order: {
        cama: { id: 'ASC' },
      },
    });

    const turnosRp = this.conn.getRepository(EntregaTurnoOrm);
    //  const ingresoIds = estancia.map(e => e.ingreso.id);

    const turno = await turnosRp.findOne({
      where: {
        subgrupo: { codigo: subgrupoCode },
        centroAtencionId: +centroId,
        isActivo: true,
      },
      relations: [
        'subgrupo',
        'medicoEntrega',
        'medicoRecibe',
        'cambiosTurno',
        /*  'pacientesTurnos',
           'pacientesTurnos.registroClinico', 
          'pacientesTurnos.pacienteEvolucion', */
      ],
      order: {
        id: 'DESC',
      },
    });

    const evolucionesRp = this.conn.getRepository(PacienteEvolucionOrm);

    if (estancia.length === 0) {
      const data = new dataRes();
      data.pacientes = [];
      return data;
    }

    const ingresoIds = estancia.map(e => e.ingreso.id);
    const pacienteIds = estancia.map(e => e.ingreso.paciente.id);

    const evoluciones = await evolucionesRp.find({ where: { ingresoId: In(ingresoIds) } });

    // Obtener solo la última evolución de cada paciente (excluyendo el ingreso actual) usando subconsulta

    const subQuery = evolucionesRp
      .createQueryBuilder('sub')
      .select('MAX(sub.id)', 'maxId')
      .where('sub.pacienteId IN (:...pacienteIds)', { pacienteIds })
      .andWhere('sub.ingresoId NOT IN (:...ingresoIds)', { ingresoIds })
      .groupBy('sub.pacienteId');

    const evolucionesAnteriores = await evolucionesRp
      .createQueryBuilder('ev')
      .innerJoin(`(${subQuery.getQuery()})`, 'sub', 'ev.id = sub.maxId')
      .leftJoinAndSelect('ev.ingreso', 'ingreso')
      .setParameters(subQuery.getParameters())
      .orderBy('ev.id', 'DESC')
      .getMany();

    //  const data = newDataToPacientesHopitalizados(estancia, turnos, this.auth);
    const pacientesHospitalizados = newDataToPacientesHopitalizados(
      estancia,
      turno,
      evoluciones,
      this.auth,
      evolucionesAnteriores
    );

    return pacientesHospitalizados;
  }

  public async fetchSubGrupoByPattern(centroId: string) {
    const camasRp = this.conn.getRepository(CamaOrm);
    const camas = await camasRp.find({
      where: [{ centroId: centroId }],
      relations: ['subgrupo'],
    });

    const subgrupos = camas
      .map(cama => cama.subgrupo)
      .filter((s): s is SubgrupoOrm => !!s)
      .filter((sg, index, self) => index === self.findIndex(x => x.id === sg.id));

    return subgrupos;
  }


  public async fetchMedicoByPattern(pattern: string) {
    const usuarioRp = this.conn.getRepository(UsuarioOrm);
    const ignoreCaseAccent = 'COLLATE Latin1_General_CI_AI';

    const qb = usuarioRp
      .createQueryBuilder('usuario')
      .where('usuario.status = :status', { status: 1 });

    const value = pattern?.trim();

    if (value) {
      const isNumeric = /^\d+$/.test(value);

      if (!isNumeric) {
        const palabras = value.split(/\s+/);

        qb.andWhere(
          new Brackets((subQb) => {
            palabras.forEach((palabra, index) => {
              subQb.andWhere(
                `usuario.nombreCompleto ${ignoreCaseAccent} LIKE :nombre${index}`,
                {
                  [`nombre${index}`]: `%${palabra}%`,
                },
              );
            });
          }),
        );
      } else {
        qb.andWhere(
          `usuario.cedula ${ignoreCaseAccent} LIKE :cedula`,
          {
            cedula: `%${value}%`,
          },
        );
      }
    }

    return qb
      .orderBy('usuario.nombreCompleto', 'ASC')
      .take(15)
      .getMany();
  }
}
