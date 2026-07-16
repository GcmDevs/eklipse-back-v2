import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';
import { ActualizarRotuloDto } from '@hpn/rotulo-medicamentos/presentation/dto/rotulo-medicamentos.dto';

@Injectable()
export class ActualizarRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };
  public async actualizar(id: number, body: ActualizarRotuloDto): Promise<boolean> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);
    try {
      await qr.startTransaction();
      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const rotulo = await rotuloRp.findOne({ where: { id } });
      if (!rotulo) {
        throw new BadRequestException('Rótulo no encontrado');
      }
      rotulo.updatedAt = new Date();
      Object.assign(rotulo, body);
      await rotuloRp.save(rotulo);
      await qr.commitTransaction();
      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
