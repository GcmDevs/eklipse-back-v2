import { orderBy } from 'lodash';
import { IsNull } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DieCentroOrm, DieEstadoOrm } from '../models/local';
import { JornadaI, OfertaI } from '../data-transfers';
import { CatalogOrm, ScheduleOrm } from '../models/diets';
import { groupByKeyExtend, TakGrouped } from '@hpn/ori/die/presentation/helpers';
import { refactorizeDietaCodeToConfig } from '../queries';
import { BaseSource } from '@common/infrastructure/services';
import { catalogDietTypeFactory } from '@hpn/ori/die/domain/types/diets';
import { getDateToString } from '@common/application/services';

@Injectable()
export class FetchDietasByFechaImpl extends BaseSource {
  public async dietasByFecha(fecha: Date) {
    let transactionFinished = false;
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const dieCentroRp = this.qr.manager.getRepository(DieCentroOrm);
      const dieEstadoRp = this.qr.manager.getRepository(DieEstadoOrm);

      const fechaFt = getDateToString(fecha);

      const dieCentros = await dieCentroRp.find({
        where: { fecha: fechaFt },
        relations: [
          'centro',
          'dieJornadas',
          'dieJornadas.horario',
          'dieJornadas.dieSubgrupos',
          'dieJornadas.dieSubgrupos.subgrupo',
          'dieJornadas.dieSubgrupos.dietas',
          'dieJornadas.dieSubgrupos.dietas.paciente',
          'dieJornadas.dieSubgrupos.dietas.cama',
        ],
      });

      for (let i = 0; i < dieCentros.length; i++) {
        const dieCentro = dieCentros[i];
        for (let j = 0; j < dieCentro.dieJornadas.length; j++) {
          const dieJornada = dieCentro.dieJornadas[j];
          for (let k = 0; k < dieJornada.dieSubgrupos.length; k++) {
            const diegrupo = dieJornada.dieSubgrupos[k];
            const groupedByGenPacien = groupByKeyExtend({
              data: diegrupo.dietas,
              colWithKey: 'pacienteId',
            });
            for (let l = 0; l < groupedByGenPacien.length; l++) {
              const dietasByPaciente = groupedByGenPacien[l].rows.filter(d => !d.isEliminado);
              if (dietasByPaciente.length > 1) {
                dietasByPaciente.slice(1).map(dieta => (dieta.isEliminado = true));
                await dieEstadoRp.save(dietasByPaciente);
              }
            }
          }
        }
      }

      const centrosIds = dieCentros.map(el => el.centro.id);

      const centrosWithJornadas: { id: number; jornadas: JornadaI[] }[] = [];

      for (let index = 0; index < centrosIds.length; index++) {
        const centroId = centrosIds[index];
        const jornadas = await this.fetchRemoteJornada(centroId);

        for (let j = 0; j < jornadas.length; j++) {
          const jornada = jornadas[j];
          const ofertas: TakGrouped<CatalogOrm>[] = await this.fetchRemoteCatalogo(
            centroId,
            jornada.id
          );
          jornada.catalogs = ofertas as any;
        }

        centrosWithJornadas.push({ id: centroId, jornadas: jornadas as any });
      }

      dieCentros.map(c => {
        const centroWithJornadas = centrosWithJornadas.filter(cj => cj.id === c.centro.id)[0];
        delete c.centroId;
        delete c.jornadaDesayunoId;
        delete c.jornadaAlmuerzoId;
        delete c.jornadaCenaId;
        c.dieJornadas.map(j => {
          j.setTypes(true);
          const jornadaFromRemote = centroWithJornadas.jornadas.filter(
            cjf => cjf.id === j.horarioId
          )[0];
          delete j.fecha;
          delete j.dieCentroId;
          j.dieSubgrupos = j.dieSubgrupos.filter(sg => sg.dietas.length);
          j.dieSubgrupos.map(s => {
            delete s.dieJornadaId;
            delete s.subGrupoId;
            delete s.creadoPorId;
            s.dietas = s.dietas
              .filter(d => !d.isEliminado)
              .map(d => {
                const dieConfig = refactorizeDietaCodeToConfig(
                  jornadaFromRemote.catalogs,
                  d.combinacionCode
                );
                d.tipos = dieConfig.tipos;
                d.consistencias = dieConfig.consistencias;
                d.extraordinarias = dieConfig.extraordinarias;

                delete d.camaId;
                delete d.isEliminado;

                d.generateValues();

                delete d.dieSubgrupoId;
                delete d.pacienteId;
                d.paciente.setTypes(true);
                d.setTypes(true);
                d.setIsValid();
                return d;
              });

            s.dietas = s.dietas.filter(d => d.isValid || d.onlyExtra);
          });
        });
        c.dieJornadas = orderBy(c.dieJornadas, 'jornadaCode', 'asc');
      });

      await this.qr.commitTransaction();

      transactionFinished = true;

      return dieCentros;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      const interval = setInterval(async () => {
        if (transactionFinished) await this.qr.release();
      }, 100);
      clearInterval(interval);
    }
  }

  private async fetchRemoteCatalogo(centroId: number, scheduleId: number, isActive?: boolean) {
    const catalogRp = this.conn.getRepository(CatalogOrm);

    const catalogs = await catalogRp.find({
      where: [
        { clientId: centroId, scheduleId, isActive },
        { clientId: centroId, scheduleId: IsNull(), isActive },
      ],
      relations: ['price'],
      order: { order: 'ASC' },
    });

    const groupedByType = groupByKeyExtend({
      data: catalogs,
      colWithKey: 'typeCode',
    });

    groupedByType.map(g => {
      const d = catalogDietTypeFactory(g.key);
      g.name = d.getForHumans();
      (g as any).code = g.key;
      (g as any).type = d.getType();
      delete g.key;
      g.rows.map(row => {
        delete row.id;
        delete row.order;
        delete row.priceId;
        delete row.typeCode;
        delete row.isActive;
        delete row.clientId;
        delete row.scheduleId;
        row.price = !row.price ? 0 : (+row.price.value as any);
        if (!row.category) delete row.category;
        if (!row.additionalInformation) delete row.additionalInformation;
      });
    });

    return orderBy(groupedByType, 'key', 'asc');
  }

  public async fetchRemoteJornada(centroId: number, scheduleId?: number) {
    const scheduleRp = this.conn.getRepository(ScheduleOrm);

    const conditions: any = { clientId: centroId, isActive: true };
    if (scheduleId) conditions.id = scheduleId;

    const schedules = await scheduleRp.find({
      where: conditions,
      order: { id: 'ASC' },
    });

    schedules.map(sc => {
      sc.timeInMinutesToDate();
      delete sc.clientId;
      delete sc.startTimeInMinutes;
      delete sc.startDaysBeforeNow;
      delete sc.endTimeInMinutes;
      delete sc.endDaysBeforeNow;
      delete sc.isActive;
    });

    return schedules;
  }
}
