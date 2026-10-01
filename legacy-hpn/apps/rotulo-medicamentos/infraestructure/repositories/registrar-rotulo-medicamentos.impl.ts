import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { IngresoOrm, PacienteOrm } from '@orm/gen';
import { MedicamentoOrm } from '@orm/gen/pacientes/medicamento.orm';
import { RotuloMedicamentoOrm } from '@orm/hpn/rotulo-medicamentos';
import { GuardarRotulosBatchDto } from 'apps/rotulo-medicamentos/presentation/dto/rotulo-medicamentos.dto';

@Injectable()
export class RegistrarRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context).getCode();
  };
  private parseFechaFiltro(value?: string, finDelDia = false): Date | undefined {
    if (!value) {
      return undefined;
    }

    const esSoloFecha = /^\d{4}-\d{2}-\d{2}$/.test(value);

    if (esSoloFecha) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(
        year,
        month - 1,
        day,
        finDelDia ? 23 : 0,
        finDelDia ? 59 : 0,
        finDelDia ? 59 : 0,
        finDelDia ? 999 : 0
      );
    }

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('Formato de fecha invalido');
    }

    return fecha;
  }

  public async registrar(dto: GuardarRotulosBatchDto) {
    const cxt = this.contexto();
    const qr = this.dynamicQR(gcmContextFactory(cxt));

    const rotulosGuardados: RotuloMedicamentoOrm[] = [];

    try {
      await qr.startTransaction();

      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const medicamentoRp = qr.manager.getRepository(MedicamentoOrm);
      const ingresoRp = qr.manager.getRepository(IngresoOrm);
      const pacienteRp = qr.manager.getRepository(PacienteOrm);
      const usuarioId = this.auth.user.id;

      const paciente = await pacienteRp.findOne({
        where: { numeroDoc: dto.rotulos[0].documento.toString() },
      });

      const ingresoId = await ingresoRp.findOne({
        where: { consecutivo: dto.rotulos[0].consecutivo.toString() },
      });

      const producto = await medicamentoRp.findOne({
        where: { codigo: dto.rotulos[0].codigoProducto },
      });

      if (!producto) {
        throw new Error('Medicamento no encontrado');
      }
      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }
      if (!ingresoId) {
        throw new Error('Ingreso no encontrado');
      }

      for (const item of dto.rotulos) {
        const rotulo = rotuloRp.create({
          ingresoId: ingresoId.id,
          pacienteId: paciente.id,
          usuarioId,
          productoId: producto.id,
          cama: item.cama,
          servicio: item.servicio ?? null,
          dosis: item.dosis,
          unidadMedida: item.unidadMedida,
          viaAdministracion: item.viaAdministracion ?? null,
          inicio: item.inicio ?? null,
          createdAt: new Date(),
          fechaRotulo: item.fechaRotulo ? new Date(item.fechaRotulo) : null,
        });

        const saved = await rotuloRp.save(rotulo);
        rotulosGuardados.push(saved);
      }

      await qr.commitTransaction();
      return rotulosGuardados;
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error?.message ?? 'Error al guardar los rótulos');
    } finally {
      await qr.release();
    }
  }
}
