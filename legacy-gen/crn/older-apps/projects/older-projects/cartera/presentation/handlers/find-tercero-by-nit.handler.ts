import { NotFoundException } from '@nestjs/common';
import { TerceroByNitModel } from '@crn/rft/cartera/application/models';
import { BaseSource } from '@crn/old/common/infrastructure/bases';

export class FindTerceroByNitHandler extends BaseSource {
  public async execute(nit: string): Promise<TerceroByNitModel> {
    try {
      const response: TerceroByNitModel = await this.conn.query(
        `SELECT
      OID id,
      TERNUMDOC documento,
      TERNOMCOM nombre
      FROM GENTERCER
      WHERE TERACTINAC = 1
      AND TERNUMDOC = @0`,
        [nit]
      );

      if (!response[0]) throw new NotFoundException();

      return response[0];
    } catch (error) {
      throw new NotFoundException();
    }
  }
}
