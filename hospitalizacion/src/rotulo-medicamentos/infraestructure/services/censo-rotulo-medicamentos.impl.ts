import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancias-prolongadas';
import { CensoRotuloMedicamentoRes } from '@hpn/rotulo-medicamentos/application/responses';
import { dataToCensoRotuloMedicamentoRes } from '../factories';

@Injectable()
export class CensoRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };
  public async fetchCenso(): Promise<CensoRotuloMedicamentoRes[]> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);
    try {
      const censoRp = qr.manager.getRepository(CensoEstanciaProlongadaOrm);
      const result = await censoRp.find({
        order: { hsuNombre: 'ASC', cama: 'ASC' },
      });
      return result.map(censo => dataToCensoRotuloMedicamentoRes(censo));
    } catch (error: any) {
      throw new Error(error?.message ?? 'Error al obtener los rótulos gestionados');
    } finally {
      await qr.release();
    }
  }
}
