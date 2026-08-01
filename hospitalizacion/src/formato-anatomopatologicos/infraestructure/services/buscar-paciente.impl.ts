import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancias-prolongadas';
import { dataToPacienteRes } from '../factories';

@Injectable()
export class FormatoMuestrasAnatomopatologicasImpl extends BaseSource {
  public async buscarPaciente(documento: string) {
    const ctx = this.auth.context;
    const qr = this.dynamicQR(ctx);

    try {
      const pacienteCensoRp = qr.manager.getRepository(CensoEstanciaProlongadaOrm);

      // Usamos findOne para obtener directamente el objeto (o null si no existe)
      const paciente = await pacienteCensoRp.findOne({
        where: { identificacion: documento },
      });

      if (!paciente) {
        throw new NotFoundException(`No se encontró paciente con documento ${documento}`);
      }

      return dataToPacienteRes(paciente);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
