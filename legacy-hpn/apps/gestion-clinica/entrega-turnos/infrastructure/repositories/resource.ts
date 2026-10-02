import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { CamaOrm, EstanciaOrm, SubgrupoOrm } from '@orm/temp';
import { FolioOrm, UsuarioOrm } from '@orm/gen';
import { Brackets, In, IsNull, Like, Not } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { newDataToPacientesHopitalizados } from '../factories';
import { EntregaTurnoOrm, PacienteEvolucionOrm, PacienteTemporalOrm } from '@orm/gcn';
import { dataRes } from '@gestion-clinica/entrega-turnos/application/responses';

@Injectable()
export class RecursosImpl extends BaseSource {
  private async fetchEspecialidadesTratantesPorIngreso(ingresoIds: number[]) {
    if (!ingresoIds.length) return new Map<number, string[]>();

    const parametros = ingresoIds.map((_, index) => `@${index}`).join(', ');
    const especialidades: { ingresoId: number; especialidad: string }[] = await this.conn.query(
      `SELECT
        F.ADNINGRESO AS ingresoId,
        E.GEEDESCRI AS especialidad,
        MAX(F.HCFECFOL) AS fechaUltimaInterconsulta
      FROM HCNINTERC I
      INNER JOIN HCNFOLIO F ON F.OID = I.HCNFOLIO
      INNER JOIN GENESPECI E ON E.OID = I.GENESPECI
      WHERE F.ADNINGRESO IN (${parametros})
      GROUP BY F.ADNINGRESO, E.GEEDESCRI
      ORDER BY F.ADNINGRESO, fechaUltimaInterconsulta DESC, E.GEEDESCRI`,
      ingresoIds
    );

    const especialidadesPorIngreso = new Map<number, string[]>();
    for (const { ingresoId, especialidad } of especialidades) {
      if (!especialidadesPorIngreso.has(ingresoId)) especialidadesPorIngreso.set(ingresoId, []);
      especialidadesPorIngreso.get(ingresoId)!.push(especialidad);
    }
    return especialidadesPorIngreso;
  }

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

    const subgrupoActual = await this.conn
      .getRepository(SubgrupoOrm)
      .findOne({ where: { codigo: subgrupoCode } });
    const asignacionesTemporales = subgrupoActual
      ? await this.conn.getRepository(PacienteTemporalOrm).find({
          where: { centroId: +centroId, subgrupoDestinoId: subgrupoActual.id },
        })
      : [];

    const estanciasTemporales = asignacionesTemporales.length
      ? await estanciaRp.find({
          where: [
            {
              id: In(asignacionesTemporales.map(a => a.estanciaId)),
              fechaEgreso: IsNull(),
              cama: { centroId, grupo: { nombre: Like('%TEMPORAL%') } },
            },
            {
              id: In(asignacionesTemporales.map(a => a.estanciaId)),
              fechaEgreso: IsNull(),
              cama: { centroId, subgrupo: { nombre: Like('%TEMPORAL%') } },
            },
          ],
          relations: [
            'ingreso',
            'ingreso.paciente',
            'ingreso.detalleContrato.contrato',
            'ingreso.especialidad',
            'cama.centro',
            'cama.grupo',
            'cama.subgrupo',
          ],
          order: { cama: { id: 'ASC' } },
        })
      : [];
    // El listado físico conserva su prioridad. Los temporales asignados se agregan
    // después, para que no se mezclen por el número de cama.
    const estanciasFisicas = [...estancia].sort((a, b) => a.cama.id - b.cama.id);
    const ingresosFisicos = new Set(estanciasFisicas.map(e => e.ingreso.id));
    const estanciasTemporalesVigentes = estanciasTemporales
      .filter(e => !ingresosFisicos.has(e.ingreso.id))
      .sort((a, b) => {
        const subgrupoA = a.cama.subgrupo?.nombre ?? '';
        const subgrupoB = b.cama.subgrupo?.nombre ?? '';
        return subgrupoA.localeCompare(subgrupoB) || a.cama.id - b.cama.id;
      });
    const estancias = [...estanciasFisicas, ...estanciasTemporalesVigentes];
    const estanciasTemporalesActivasIds = new Set(estanciasTemporales.map(e => e.id));
    const asignacionesPorEstancia = new Map(
      asignacionesTemporales
        .filter(asignacion => estanciasTemporalesActivasIds.has(asignacion.estanciaId))
        .map(asignacion => [asignacion.estanciaId, asignacion.id])
    );

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

    if (estancias.length === 0) {
      const data = new dataRes();
      data.pacientes = [];
      data.temporalesConfigurados = true;
      return data;
    }

    const ingresoIds = estancias.map(e => e.ingreso.id);
    const pacienteIds = estancias.map(e => e.ingreso.paciente.id);

    const [evoluciones, especialidadesTratantesPorIngreso] = await Promise.all([
      evolucionesRp.find({ where: { ingresoId: In(ingresoIds) } }),
      this.fetchEspecialidadesTratantesPorIngreso(ingresoIds),
    ]);

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
      estancias,
      turno,
      evoluciones,
      this.auth,
      evolucionesAnteriores,
      asignacionesPorEstancia,
      especialidadesTratantesPorIngreso
    );
    pacientesHospitalizados.temporalesConfigurados = true;

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
          new Brackets(subQb => {
            palabras.forEach((palabra, index) => {
              subQb.andWhere(`usuario.nombreCompleto ${ignoreCaseAccent} LIKE :nombre${index}`, {
                [`nombre${index}`]: `%${palabra}%`,
              });
            });
          })
        );
      } else {
        qb.andWhere(`usuario.cedula ${ignoreCaseAccent} LIKE :cedula`, {
          cedula: `%${value}%`,
        });
      }
    }

    return qb.orderBy('usuario.nombreCompleto', 'ASC').take(15).getMany();
  }
}
