import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { RotulosFechaQueryDto } from 'apps/rotulo-medicamentos/presentation/dto/rotulo-medicamentos.dto';
import { RotuloMedicamentoOrm } from '@orm/hpn/rotulo-medicamentos/rotulo-medicamentos.orm';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class RotuloMedicamentosImpl extends BaseSource {
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
  public async obtenerRotulos(query: RotulosFechaQueryDto) {
    const cxt = this.contexto();
    const qr = this.dynamicQR(gcmContextFactory(cxt));
    try {
      const fechaInicio = this.parseFechaFiltro(query?.fechaInicio);
      const fechaFinal = this.parseFechaFiltro(query?.fechaFinal, true);

      if (fechaInicio && fechaFinal && fechaInicio > fechaFinal) {
        throw new BadRequestException('La fecha inicial no puede ser mayor que la fecha final');
      }

      const where: any = {};

      if (fechaInicio && fechaFinal) {
        where.createdAt = Between(fechaInicio, fechaFinal);
      } else if (fechaInicio) {
        where.createdAt = MoreThanOrEqual(fechaInicio);
      } else if (fechaFinal) {
        where.createdAt = LessThanOrEqual(fechaFinal);
      }

      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const rotulos = await rotuloRp.find({
        order: { id: 'DESC' },
        relations: ['producto', 'ingreso', 'usuario', 'paciente'],
        where,
      });

      const rotulosMapeados = rotulos.map(rotulo => ({
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
