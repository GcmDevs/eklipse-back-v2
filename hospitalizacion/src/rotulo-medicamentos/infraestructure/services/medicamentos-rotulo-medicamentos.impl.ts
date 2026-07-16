import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { medicamentosQuery } from '../queries/medicamentos.query';
import { IngresoOrm } from '@orm/adn';
import { MedicamentoRotuloRes } from '@hpn/rotulo-medicamentos/application/responses';
import { dataToMedicamentoRotuloRes } from '../factories';
import { medicamentosV2Query } from '../queries/medicamentosv2.query';

@Injectable()
export class MedicamentosRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };

  public async fetchMedicamentos(ingreso: number): Promise<MedicamentoRotuloRes[]> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);

    const ingresoRp = qr.manager.getRepository(IngresoOrm);
    const ingresoEntity = await ingresoRp.findOne({
      where: { consecutivo: ingreso.toString() },
    });

    const query = await qr.query(medicamentosQuery(ingresoEntity.id));

    return query.map(medicamento => dataToMedicamentoRotuloRes(medicamento));
  }
}
