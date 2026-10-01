import { Injectable } from '@nestjs/common';
import { CambiarEstadoEpicrisisService } from '@hcn/ori/epi/application/services';
import { EpicrisisDto } from '@hcn/ori/epi/application/data-transfers';
import { castDataToEpicrisisConfirmadaDto } from '../factories';
import { findEpicrisisByConsecutivoQuery } from '../queries';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class CambiarEstadoEpicrisisApplication
  extends BaseSource
  implements CambiarEstadoEpicrisisService
{
  public async findByConsecutivo(consecutivo: number): Promise<EpicrisisDto> {
    const result = await this.conn.query(findEpicrisisByConsecutivoQuery(consecutivo));

    return castDataToEpicrisisConfirmadaDto(result[0]);
  }

  public async confirmar(consecutivo: number): Promise<boolean> {
    return await this._cambiarEstadoEpicrisis(consecutivo, true);
  }

  public async desconfirmar(consecutivo: number): Promise<boolean> {
    return await this._cambiarEstadoEpicrisis(consecutivo, false);
  }

  private async _cambiarEstadoEpicrisis(consecutivo: number, confirmar: boolean): Promise<boolean> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      await this.qr.query(
        `UPDATE HCNEPICRI
         SET HCEESTDOC = ${confirmar ? 1 : 0}
         WHERE HCECONSEC = @0`,
        [consecutivo]
      );

      await this.qr.commitTransaction();
      return true;
    } catch (_) {
      await this.qr.rollbackTransaction();
    } finally {
      await this.qr.release();
    }
  }
}
