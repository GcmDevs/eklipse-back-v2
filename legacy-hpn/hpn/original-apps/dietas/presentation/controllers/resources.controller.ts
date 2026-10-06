import { IsNull } from 'typeorm';
import { orderBy } from 'lodash';
import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogOrm, ScheduleOrm } from '@lgc/die/infrastructure/models/diets';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { catalogDietTypeFactory } from '@lgc/die/domain/types/diets';
import { DietasBaseSource } from '@lgc/die/infrastructure/sources';
import { DIE_AUTHORITIES } from '@lgc/die/application/constants';
import { OFERTA } from '@lgc/die/domain/types/local';
import { groupByKeyExtend } from '../helpers';

@CommonGuards()
@ApiTags('v1 - Dietas')
@Controller('dim/dietas/v1/resources')
export class ResourcesController extends DietasBaseSource {
  @Authorities([DIE_AUTHORITIES.REGISTRAR])
  @Get('subgrupos')
  async getAllSubgroup(@Query('centroId') centroId: number) {
    try {
      return await this.conn.query(
        `SELECT
        DISTINCT(SG.OID) id,
        SG.HSUCODIGO codigo,
        SG.HSUNOMBRE nombre,
        C.ADNCENATE centroId
        FROM HPNSUBGRU SG
        INNER JOIN HPNDEFCAM C ON SG.OID = C.HPNSUBGRU
        ${centroId ? `WHERE C.ADNCENATE = ${centroId}` : ''}`
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([DIE_AUTHORITIES.REGISTRAR])
  @Get('horarios/:centroId')
  async fetchJornadas(@Param('centroId') centroId: number) {
    try {
      const centro = await this.fetchCentro(+centroId);

      const scheduleRp = this.conn.getRepository(ScheduleOrm);
      const conditions: any = { clientId: centro.id, isActive: true };
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
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([DIE_AUTHORITIES.REGISTRAR])
  @Get('dieta-config/:centroId/:horarioId')
  async fetchDietaConfig(
    @Param('centroId') centroId: number,
    @Param('horarioId') horarioId: number
  ) {
    try {
      const centro = await this.fetchCentro(+centroId);
      const horario = (await this.fetchHorarios(centro.id, horarioId)) as ScheduleOrm;
      const ofertas = await this.fetchOfertas(centro.id, horario.id, true);

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

      const data = orderBy(groupedByType, 'key', 'asc');

      if (typeof data === 'string') throw new BadRequestException(data);

      const ofertasGrouped = data.filter(
        (el: any) => [OFERTA.TIPO.getCode(), OFERTA.CONSISTENCIA.getCode()].indexOf(el.code) >= 0
      );

      const extraordinarias = data.filter(
        (el: any) =>
          [OFERTA.MERIENDA.getCode(), OFERTA.DIETA_FAMILIAR.getCode()].indexOf(el.code) >= 0
      );

      extraordinarias.map((e: any) => {
        e.rows.map((r: any) => {
          delete r.price;
        });
      });

      return {
        ofertas: orderBy(ofertasGrouped, 'code', 'asc'),
        extraordinarias,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  subgruposExcentos: string[] = [
    /* 'TEMCM01', 'CMOBS106', 'AC0118', 'CMOBS106' */
  ];

  @Authorities([DIE_AUTHORITIES.VER_JORNADA])
  @Get('comparativa-subgrupos-jornada')
  async fetchComparativa() {
    const result: any = await this.conn.query(`
      select SG.OID id, SG.HSUCODIGO codigo, SG.HSUNOMBRE nombre, C.ADNCENATE centroId
      from HPNESTANC E
      INNER JOIN HPNDEFCAM C ON C.OID  = E.HPNDEFCAM
      INNER JOIN HPNSUBGRU SG ON SG.OID = C.HPNSUBGRU
      WHERE E.HESFECSAL IS NULL`);

    const resultGrouped = groupByKeyExtend({
      data: result,
      colWithKey: 'id',
      colWithName: 'nombre',
    });

    resultGrouped.map((r: any) => {
      r.id = r.key;
      r.nombre = r.name;
      r.codigo = r.rows[0].codigo;
      r.nombre = r.name;
      r.centroId = r.rows[0].centroId;
      r.pacientes = r.rows.length;

      if (this.subgruposExcentos.indexOf(r.codigo) >= 0) r.isExcento = true;
      else r.isExcento = false;

      delete r.key;
      delete r.name;
      delete r.rows;
    });

    return resultGrouped;
  }
}
