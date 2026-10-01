import { Injectable } from '@nestjs/common';
import { concat } from '@common/application/services';
import { BaseSource } from '@common/infrastructure/services';
import { CamaForHomeRes, GastoCamaForHomeRes } from '../responses';
import { camasForHomeQueries } from '../queries';

@Injectable()
export class FetchCamasForHome extends BaseSource {
  async execute() {
    const camas: CamaForHomeRes[] = await this.conn.query(camasForHomeQueries.fetch());
    const gastos: GastoCamaForHomeRes[] = await this.conn.query(camasForHomeQueries.fetchGasto());

    camas.map(e => {
      e.TOTAL_CONSUMO = 0;
      e.PACNOMCOM = concat([e.PACPRINOM, e.PACSEGNOM, e.PACPRIAPE, e.PACSEGAPE]);
      const gasto = gastos.filter(i => e.ADNINGRESO === i.ADNINGRESO)[0];
      if (gasto) e.TOTAL_CONSUMO = gasto.SUMA;
    });

    return camas;
  }
}
