import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  CrearRotuloDto,
  GuardarRotulosBatchDto,
} from '@hpn/rotulo-medicamentos/presentation/dto/rotulo-medicamentos.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { MedicamentoOrm, RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';
import { IngresoOrm } from '@orm/adn';
import { PacienteOrm } from '@orm/gen/pacientes';
import { RegistrarRotuloMedicamentoRes } from '@hpn/rotulo-medicamentos/application/responses';
import { dataToRegistrarRotuloMedicamentoRes } from '../factories';
import { In } from 'typeorm';
import { medicamentosQuery } from '../queries/medicamentos.query';

@Injectable()
export class RegistrarRotuloMedicamentosImpl extends BaseSource {
  private contexto = () => {
    const context = this.auth.context.getCode();
    return gcmContextFactory(context);
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

  public async registrar(dto: CrearRotuloDto): Promise<RegistrarRotuloMedicamentoRes[]> {
    const cxt = this.contexto();
    const qr = this.dynamicQR(cxt);

    const rotulosGuardados: RotuloMedicamentoOrm[] = [];

    try {
      await qr.startTransaction();

      const rotuloRp = qr.manager.getRepository(RotuloMedicamentoOrm);
      const medicamentoRp = qr.manager.getRepository(MedicamentoOrm);
      const ingresoRp = qr.manager.getRepository(IngresoOrm);
      const pacienteRp = qr.manager.getRepository(PacienteOrm);
      const usuarioId = this.auth.user.id;

      const paciente = await pacienteRp.findOne({
        where: { numeroDoc: dto.documento.toString() },
      });

      const ingresoId = await ingresoRp.findOne({
        where: { consecutivo: dto.consecutivo.toString() },
      });

      const productos = await medicamentoRp.find({
        where: { codigo: dto.codigoProducto },
      });
      const productosPorCodigo = new Map(productos.map(producto => [producto.codigo, producto]));

      if (!paciente) {
        throw new Error('Paciente no encontrado');
      }
      if (!ingresoId) {
        throw new Error('Ingreso no encontrado');
      }

      const medicamentos = await qr.query(medicamentosQuery(ingresoId.id));
      const cantidadesPorCodigo = new Map<string, number>(
        medicamentos.map(medicamento => [medicamento.CODIGO, Number(medicamento.CANTIDAD)])
      );

      const cantidadActual = cantidadesPorCodigo.get(dto.codigoProducto);
      const producto = productosPorCodigo.get(dto.codigoProducto);

      if (cantidadActual === undefined) {
        throw new Error(`El medicamento ${dto.codigoProducto} no está ordenado para el ingreso`);
      }
      if (cantidadActual <= 0) {
        throw new Error(`El medicamento ${dto.codigoProducto} ya fue administrado completamente`);
      }

      const cantidadRestante = cantidadActual - 1;
      const administrado = cantidadRestante === 0;
      const rotulo = rotuloRp.create({
        ingresoId: ingresoId.id,
        folio: dto.folio,
        pacienteId: paciente.id,
        usuarioId,
        productoId: producto.id,
        cama: dto.cama,
        servicio: dto.servicio ?? null,
        dosis: dto.dosis,
        unidadMedida: dto.unidadMedida,
        viaAdministracion: dto.viaAdministracion ?? null,
        inicio: dto.inicio ?? null,
        activo: true,
        guardado: administrado,
        cantidad: cantidadRestante,
        createdAt: new Date(),
        fechaRotulo: dto.fechaRotulo ? new Date(dto.fechaRotulo) : null,
      });

      const saved = await rotuloRp.save(rotulo);
      rotulosGuardados.push(saved);
      cantidadesPorCodigo.set(dto.codigoProducto, cantidadRestante);

      await qr.commitTransaction();
      return rotulosGuardados.map(rotulo => dataToRegistrarRotuloMedicamentoRes(rotulo));
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error?.message ?? 'Error al guardar los rótulos');
    } finally {
      await qr.release();
    }
  }
}
