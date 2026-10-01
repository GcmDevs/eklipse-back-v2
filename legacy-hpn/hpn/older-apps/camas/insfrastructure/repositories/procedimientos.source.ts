import { GcmContexts } from '@common/application/constants';
import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { getProcedimientosQuery } from '../queries';
import { ProcedimientosResponse, ProcedimientosResponseQuery } from '../responses';

@Injectable()
export class ProcedimientosSourceRepository extends BaseSource {
  public async getProcedimientos(
    ctx: GcmContexts,
    consecutivo: number
  ): Promise<ProcedimientosResponse[]> {
    const qr = this.dynamicQR(gcmContextFactory(ctx));

    try {
      const result: ProcedimientosResponseQuery[] = await qr.query(
        getProcedimientosQuery(consecutivo)
      );
      // if (!result || result.length === 0) {
      //   throw new Error('No se encontraron resultados para los procedimientos solicitados');
      // }
      return result.map(procedimiento => ({
        sipCodigo: procedimiento.SIPCODIGO,
        sipNombre: procedimiento.SIPNOMBRE,
        tipo: procedimiento.TIPO,
        observacion: procedimiento.HCSOBSERV,
        fechaSolicitud: procedimiento.FECHASOLICITUD,
        estado: procedimiento.ESTADO,
        codigoMedico: procedimiento.GENMEDICO,
        nombreMedico: procedimiento.GMENOMCOM,
      }));
    } catch (error) {
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
