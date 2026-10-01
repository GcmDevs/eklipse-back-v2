import { BaseSource } from '@common/infrastructure/services';
import { OrdenSuministroRecibidaModificadaOrm } from '@orm/inn/suministro-paciente';

export class SuministrosListosParaEntregaImpl extends BaseSource {
  public async execute(ordenSuministrosId: number): Promise<boolean> {
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const rp = this.qr.manager.getRepository(OrdenSuministroRecibidaModificadaOrm);

      const exist = await rp.findOne({ where: { ordenSuministrosId } });

      if (exist) {
        throw new Error('Ya se ha registrado esta orden de suministro como lista para entrega');
      }

      const newMod = new OrdenSuministroRecibidaModificadaOrm();
      newMod.ordenSuministrosId = ordenSuministrosId;
      newMod.usuarioEntregaId = this.auth.id;

      await rp.save(newMod);

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
