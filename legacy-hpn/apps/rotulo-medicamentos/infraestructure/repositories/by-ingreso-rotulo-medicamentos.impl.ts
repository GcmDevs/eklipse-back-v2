import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { RotuloMedicamentoOrm } from '@orm/hpn/rotulo-medicamentos';
import { PacienteOrm } from '@orm/gen';

@Injectable()
export class ByIngresoRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context).getCode();
  };
  async obtenerRotulosPorIngreso(documento: number) {
    const cxt = this.contexto();
    const qr = this.dynamicQR(gcmContextFactory(cxt));
    try {
      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const pacienteRp = qr.manager.getRepository(PacienteOrm);

      const pacienteEntity = await pacienteRp.findOne({
        where: { numeroDoc: documento.toString() },
        // relations: ['ingresos'],
      });

      if (!pacienteEntity) {
        throw new Error('Paciente no encontrado');
      }

      const res = await rotuloRp.find({
        where: { pacienteId: pacienteEntity.id },
        order: { createdAt: 'DESC' },
        relations: ['producto', 'ingreso', 'usuario', 'paciente'],
      });

      const rotulosMapeados = res.map(rotulo => ({
        id: rotulo.id,
        nombrePaciente: rotulo.paciente.nombreCompleto,
        numeroDocumento: rotulo.paciente.numeroDoc,
        codigoProducto: rotulo.producto.codigo,
        descripcionProducto: rotulo.producto.descripcionCorta,
        fechaRotulo: rotulo.fechaRotulo,
        cama: rotulo.cama,
        servicio: rotulo.servicio,
        dosis: rotulo.dosis,
        unidadMedida: rotulo.unidadMedida,
        viaAdministracion: rotulo.viaAdministracion,
        inicio: rotulo.inicio,
        usuario: rotulo.usuario.nombreCompleto,
        ingresoConsecutivo: rotulo.ingreso.consecutivo,
      }));

      return rotulosMapeados;
    } catch (error: any) {
      throw new BadRequestException(error?.message ?? 'Error al obtener los rótulos gestionados');
    } finally {
      await qr.release();
    }
  }
}
