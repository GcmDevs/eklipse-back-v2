import { BaseSource } from '@common/infrastructure/services';
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EstanciasProlongadasOrm } from '@orm/hpn/estancias-prolongadas';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

@Injectable()
export class EstanciasProlongadasActivasImpl extends BaseSource {
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

  public async getEstanciasProlongadasActivas(
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<EstanciasProlongadasOrm[]> {
    const fechaInicioDate = this.parseFechaFiltro(fechaInicio);
    const fechaFinDate = this.parseFechaFiltro(fechaFin, true);

    if (fechaInicioDate && fechaFinDate && fechaInicioDate > fechaFinDate) {
      throw new BadRequestException('La fecha inicial no puede ser mayor que la fecha final');
    }

    const where: any = { estado: true };

    if (fechaInicioDate && fechaFinDate) {
      where.createdAt = Between(fechaInicioDate, fechaFinDate);
    } else if (fechaInicioDate) {
      where.createdAt = MoreThanOrEqual(fechaInicioDate);
    } else if (fechaFinDate) {
      where.createdAt = LessThanOrEqual(fechaFinDate);
    }

    const estanciasProlongadasRp = this.conn.getRepository(EstanciasProlongadasOrm);
    const data = await estanciasProlongadasRp.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['preguntas', 'acciones', 'seguimientos'],
    });
    if (!data.length) {
      throw new NotFoundException('No se encontraron estancias activas');
    }

    return data;
  }
}
