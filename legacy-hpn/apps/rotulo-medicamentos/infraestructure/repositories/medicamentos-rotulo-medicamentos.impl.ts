import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { IngresoOrm } from '@orm/gen';
import { medicamentosQuery } from '../queries/medicamentos.query';

@Injectable()
export class MedicamentosRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context).getCode();
  };

  public async fetchMedicamentos(ingreso: number) {
    const cxt = this.contexto();
    const qr = this.dynamicConn(gcmContextFactory(cxt));

    const ingresoRp = qr.getRepository(IngresoOrm);
    const ingresoEntity = await ingresoRp.findOne({
      where: { consecutivo: ingreso.toString() },
    });

    const query = await qr.query(medicamentosQuery(ingresoEntity.id));

    return query;
  }
}
