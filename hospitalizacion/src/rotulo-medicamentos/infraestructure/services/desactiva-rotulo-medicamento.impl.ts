import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';
import { gcmContextFactory } from '@common/domain/types';

@Injectable()
export class DesactivarRotuloMedicamentoImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };
  public async desactivar(id: number): Promise<boolean> {
    const ctx = this.contexto();
    const qr = this.dynamicQR(ctx);
    try {
      await qr.startTransaction();
      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const rotulo = await rotuloRp.findOne({ where: { id } });
      if (!rotulo) {
        return false;
      }
      console.log('00', rotulo);

      rotulo.activo = false;
      await rotuloRp.save(rotulo);
      console.log('01', rotulo);
      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(`Error al desactivar el rótulo de medicamento: ${error.message}`);
    } finally {
      await qr.release();
    }
  }
}
