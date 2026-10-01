import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { RotuloMedicamentoOrm } from '@orm/hpn/rotulo-medicamentos';

@Injectable()
export class TodosRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context).getCode();
  };
  public async getRotulos() {
    const cxt = this.contexto();
    const qr = this.dynamicConn(gcmContextFactory(cxt));

    const rotuloRp = qr.getRepository(RotuloMedicamentoOrm);
    const rotulos = await rotuloRp.find({
      order: { createdAt: 'DESC' },
    });
    return rotulos;
  }
}
