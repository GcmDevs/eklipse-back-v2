import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { orderBy, uniqBy } from 'lodash';
import { GcmContextType } from '@common/domain/types';
import { catalogDietTypeFactory } from '@lgc/die/domain/types';
import { groupByKeyExtend } from '@lgc/die/presentation/helpers';
import { OfertaI } from '../data-transfers';
import {
  CatalogOrm,
  CentroOrm,
  DieJornadaOrm,
  DieSubgrupoOrm,
  ScheduleOrm,
  SubgrupoOrm,
} from '../orm';
import {
  DietaI,
  dietasPedidasArgumentQuery,
  fetchPacientesAcostados,
  pacientesAcostadosFactory,
  refactorizeDietaCodeToConfig,
} from '../queries';

/** Consulta compartida por la pantalla y el cierre automático, sin depender de HTTP. */
@Injectable()
export class ConsultaPacientesDietasService {
  public async execute(
    conn: DataSource,
    context: GcmContextType,
    centroId: number,
    horarioId: number,
    subgrupoCode: string,
    fecha: Date
  ) {
    const fechaFt = new Date(`${fecha.toISOString().slice(0, 10)}T00:00:00.000Z`);
    const centro = await conn.getRepository(CentroOrm).findOne({ where: { id: centroId } });
    if (!centro) throw new BadRequestException('No existe un centro con este id');
    const horario = await conn.getRepository(ScheduleOrm).findOne({
      where: { id: horarioId, clientId: centroId },
    });
    if (!horario) throw new BadRequestException('Este horario no está relacionado a este centro');

    const ofertas = await this.ofertas(conn, centroId, horarioId);
    const pacientesRes = await conn.query(fetchPacientesAcostados(context, centroId, subgrupoCode));
    const pacientes = uniqBy(
      orderBy(pacientesRes, 'HCACODIGO', 'asc').map(p => pacientesAcostadosFactory(ofertas, p)),
      'camaId'
    );
    const subgrupo = await conn.getRepository(SubgrupoOrm).findOne({
      where: { codigo: subgrupoCode },
    });
    if (!subgrupo) throw new BadRequestException('Este subgrupo no existe');

    const dieJornada = await conn.getRepository(DieJornadaOrm).findOne({
      where: { fecha: fechaFt, horarioId },
    });
    const dieSubgrupo = dieJornada
      ? await conn.getRepository(DieSubgrupoOrm).findOne({
          where: { dieJornadaId: dieJornada.id, subGrupoId: subgrupo.id },
          relations: ['dietas'],
        })
      : null;
    const dietas = dieSubgrupo?.dietas ?? [];
    const dieSolicitada = !!(dietas.length && dieJornada);

    let dietasAnteriores: DietaI[] = [];
    if (!dieSubgrupo && pacientes.length) {
      dietasAnteriores = await conn.query(
        `SELECT TOP(${pacientes.length}) ${dietasPedidasArgumentQuery()}
        WHERE SG.HSUCODIGO = @1 AND C.ADNCENATE = @0 ORDER BY D.OID DESC`,
        [centroId, subgrupoCode]
      );
    }

    for (const paciente of pacientes) {
      const registrada = dietas.find(d => d.pacienteId == paciente.paciente.id);
      const anterior = dietasAnteriores.find(d => d.pacienteId == paciente.paciente.id);
      const dieta = registrada ?? anterior;
      if (!dieta) continue;

      const fechaDieta = registrada ? dieJornada.fecha : anterior.fecha;
      const usarDietaDoctor =
        !!paciente.folio.fecha &&
        new Date(paciente.folio.fecha).getTime() > new Date(fechaDieta).getTime();
      paciente.dieta.id = dieta.id;
      paciente.dieta.enAislamiento = dieta.enAislamiento;
      paciente.dieta.ultimaObservacion = null;
      paciente.dieta.observacion = dieta.observacion;
      if (!usarDietaDoctor || dieSolicitada) {
        const config = registrada ? registrada.combinacionCode : anterior.config;
        const precarga = refactorizeDietaCodeToConfig(ofertas, config || '');
        paciente.dieta.tipos = precarga.tipos;
        paciente.dieta.consistencias = precarga.consistencias;
        paciente.dieta.extraordinarias = precarga.extraordinarias;
      }
    }

    return {
      dieSolicitada,
      dieCentroId: dieJornada && dieSubgrupo ? dieJornada.dieCentroId : null,
      dieJornadaId: dieJornada && dieSubgrupo ? dieJornada.id : null,
      dieSubgrupoId: dieJornada && dieSubgrupo ? dieSubgrupo.id : null,
      pacientes,
    };
  }

  private async ofertas(conn: DataSource, centroId: number, horarioId: number): Promise<OfertaI[]> {
    const catalogs = await conn.getRepository(CatalogOrm).find({
      where: [
        { clientId: centroId, scheduleId: horarioId, isActive: true },
        { clientId: centroId, scheduleId: IsNull(), isActive: true },
      ],
      relations: ['price'],
      order: { order: 'ASC' },
    });
    const grouped = groupByKeyExtend({ data: catalogs, colWithKey: 'typeCode' });
    return grouped.map(group => {
      const tipo = catalogDietTypeFactory(group.key);
      return {
        name: tipo.getForHumans(),
        code: group.key,
        type: {
          code: tipo.getType().getCode(),
          forHumans: tipo.getType().getForHumans(),
        },
        rows: group.rows.map(row => ({
          code: row.code,
          name: row.name,
          ...(row.category ? { category: row.category } : {}),
          ...(row.additionalInformation
            ? { additionalInformation: row.additionalInformation }
            : {}),
          price: row.price ? +row.price.value : 0,
          tipo: row.tipo,
          consistencia: row.consistencia,
        })),
      };
    });
  }
}
