import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';
import { PacienteOrm } from '@orm/gen/pacientes';
import { RotuloMedicamentoRes } from '@hpn/rotulo-medicamentos/application/responses';
import { dataToRotuloMedicamentoRes } from '../factories';
import { Between } from 'typeorm';

@Injectable()
export class ByIngresoRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
  };
  async obtenerRotulosPorIngreso(documento: number): Promise<RotuloMedicamentoRes[]> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);
    try {
      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const pacienteRp = qr.manager.getRepository(PacienteOrm);

      const fechaInicio = new Date();
      fechaInicio.setHours(0, 0, 0, 0);

      const fechaFin = new Date();
      fechaFin.setHours(23, 59, 59, 999);

      const pacienteEntity = await pacienteRp.findOne({
        where: { numeroDoc: documento.toString() },
        // relations: ['ingresos'],
      });

      if (!pacienteEntity) {
        throw new Error('Paciente no encontrado');
      }

      const res = await rotuloRp.find({
        where: {
          pacienteId: pacienteEntity.id,
          activo: true,
          createdAt: Between(fechaInicio, fechaFin),
        },
        order: { createdAt: 'DESC' },
        relations: ['producto', 'ingreso', 'usuario', 'paciente'],
      });

      return res.map(rotulo => dataToRotuloMedicamentoRes(rotulo));
    } catch (error: any) {
      throw new BadRequestException(error?.message ?? 'Error al obtener los rótulos gestionados');
    } finally {
      await qr.release();
    }
  }
}
