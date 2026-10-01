import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancia-prolongadas';

@Injectable()
export class CensoRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context).getCode();
  };
  public async fetchCenso() {
    const cxt = this.contexto();
    const qr = this.dynamicConn(gcmContextFactory(cxt));
    const censoRp = qr.getRepository(CensoEstanciaProlongadaOrm);
    const result = await censoRp.find({
      order: { hsuNombre: 'ASC' },
    });
    return result;
  }
}
