import { BadRequestException, Injectable } from '@nestjs/common';
import { CentroOrm } from '@lgc/die/infrastructure/models/local';
import { BaseSource } from '@common/infrastructure/services';
import { CatalogOrm, ScheduleOrm } from '../models/diets';
import { IsNull } from 'typeorm';
import { TakGrouped, groupByKeyExtend } from '@lgc/die/presentation/helpers';
import { catalogDietTypeFactory } from '@lgc/die/domain/types/diets';
import { OfertaI } from '../data-transfers';
import { orderBy } from 'lodash';

@Injectable()
export class DietasBaseSource extends BaseSource {
  protected async fetchCentro(id: number) {
    const centroRp = this.conn.getRepository(CentroOrm);
    const centro = await centroRp.findOne({ where: { id } });
    if (!centro) throw new BadRequestException('No existe un centro con este id');
    return centro;
  }

  protected async fetchHorarios(centroId: number, horarioId?: number) {
    const horarioRp = this.conn.getRepository(ScheduleOrm);
    if (!horarioId) {
      const horarios = await horarioRp.find({ where: { clientId: centroId } });
      if (!horarios) {
        throw new BadRequestException('No existen horarios relacionados a este centro');
      }
      horarios.map(el => {
        el.timeInMinutesToDate();
      });
      return horarios;
    } else {
      const horario = await horarioRp.findOne({ where: { id: horarioId, clientId: centroId } });
      if (!horario) {
        throw new BadRequestException('Este horario no está relacionado a este centro');
      }
      horario.timeInMinutesToDate();
      return horario;
    }
  }

  protected async fetchOfertas(centroId: number, horarioId: number, isActive?: boolean) {
    const conditions = isActive === undefined ? {} : { isActive };
    const catalogRp = this.conn.getRepository(CatalogOrm);
    const catalogs = await catalogRp.find({
      where: [
        { clientId: centroId, scheduleId: horarioId, ...conditions },
        { clientId: centroId, scheduleId: IsNull(), ...conditions },
      ],
      relations: ['price'],
      order: { order: 'ASC' },
    });
    return catalogs;
  }

  protected orderOfertas(ofertas: CatalogOrm[]) {
    const groupedByType = groupByKeyExtend({
      data: ofertas,
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
    const ofertasOrdered: OfertaI[] = orderBy(groupedByType, 'key', 'asc') as any;
    return ofertasOrdered;
  }
}
