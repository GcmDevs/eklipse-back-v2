import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';
import { RegistrarRotuloMedicamentoRes } from '@hpn/rotulo-medicamentos/application/responses';
import { dataToRegistrarRotuloMedicamentoRes } from '../factories';

@Injectable()
export class TodosRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };
  public async getRotulos(): Promise<RegistrarRotuloMedicamentoRes[]> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);
    try {
      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const rotulos = await rotuloRp.find({
        where: { activo: true },
        order: { createdAt: 'DESC' },
      });
      return rotulos.map(rotulo => dataToRegistrarRotuloMedicamentoRes(rotulo));
    } catch (error: any) {
      throw new Error(error?.message ?? 'Error al obtener los rótulos gestionados');
    } finally {
      await qr.release();
    }
  }
}
