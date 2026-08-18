import { BaseSource } from '@common/infrastructure/services';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PacienteOrm } from '@orm/gen/pacientes';
import { GuardarRegistroMuestraDto } from '@hpn/formato-anatomopatologicos/presentation/dto';
import {
  DetalleMuestraCupsOrm,
  FormatoMuestraAnatomopatologicaOrm,
} from '../orm';
import { QueryRunner } from 'typeorm';

export interface RegistroMuestraRes {
  id: number;
  numero: number;
  numeroCaso: string;
  fechaTomaMuestra: string;
  mesToma: string;
  fechaRecepcionLabPatologia: string;
  paciente: {
    numeroDocumento: string;
    nombres: string;
    eps: string;
    ingreso?: number;
  };
  institucionOrigen: string;
  prestadorExterno?: string;
  observaciones?: string;
  cupsItems: {
    cups: string;
    cantidad: number;
    tipoCups: string;
    especimen: string;
    sospechoso: string;
  }[];
}

@Injectable()
export class FormatoMuestrasAnatomopatologicasImpl extends BaseSource {
  public async buscarPaciente(documento: string) {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const paciente = await qr.manager.getRepository(PacienteOrm).findOne({
        where: { numeroDoc: documento },
        relations: { ingresos: true, detalleContrato: true },
      });
      if (!paciente) throw new NotFoundException(`No se encontró paciente con documento ${documento}`);

      const ingreso = paciente.ingresos.sort(
        (a, b) => b.fechaIngreso.getTime() - a.fechaIngreso.getTime(),
      )[0];
      return {
        numeroDocumento: paciente.numeroDoc,
        nombres: paciente.nombreCompleto,
        eps: paciente.detalleContrato?.nombre ?? '',
        ingreso: ingreso?.id,
      };
    } finally {
      await qr.release();
    }
  }

  public async buscarCups(codigo: string): Promise<{ cups: string; descripcion: string } | null> {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const rows = await qr.query(
        'SELECT TOP 1 SIPCODIGO AS cups, SIPNOMBRE AS descripcion FROM GENSERIPS WHERE SIPCODIGO = @0',
        [codigo.trim()],
      );
      return rows[0] ?? null;
    } finally {
      await qr.release();
    }
  }

  public async listar(): Promise<RegistroMuestraRes[]> {
    const qr = this.dynamicQR(this.auth.context);
    try {
      const registros = await qr.manager.getRepository(FormatoMuestraAnatomopatologicaOrm).find({
        relations: { cups: true },
        order: { createdAt: 'DESC' },
      });
      return registros.map(registro => this.toResponse(registro));
    } finally {
      await qr.release();
    }
  }

  public async crear(dto: GuardarRegistroMuestraDto): Promise<RegistroMuestraRes> {
    const qr = this.dynamicQR(this.auth.context);
    try {
      await qr.startTransaction();
      const registroRp = qr.manager.getRepository(FormatoMuestraAnatomopatologicaOrm);
      const detalleRp = qr.manager.getRepository(DetalleMuestraCupsOrm);
      const paciente = await this.obtenerPacienteAutomatico(dto.paciente.numeroDocumento, qr);
      const registro = registroRp.create({
        numeroCaso: '',
        fechaTomaMuestra: dto.fechaTomaMuestra,
        fechaRecepcionLaboratorio: dto.fechaRecepcionLabPatologia,
        ingreso: paciente.ingreso ?? null,
        nombrePaciente: paciente.nombres,
        numeroDocumento: paciente.numeroDocumento,
        eps: paciente.eps,
        diagnostico: '',
        institucionOrigen: dto.institucionOrigen.trim(),
        prestadorExterno: dto.prestadorExterno?.trim() ?? '',
        observaciones: dto.observaciones?.trim() ?? '',
        usuarioCreacionId: this.auth.id,
        usuarioCreacionNombre: this.auth.user.fullName ?? '',
      });
      const saved = await registroRp.save(registro);
      saved.numeroCaso = String(saved.id);
      await registroRp.save(saved);
      const cups = dto.cupsItems.map(item =>
        detalleRp.create({
          registroId: saved.id,
          codigoCups: item.cups.trim(),
          cantidad: item.cantidad,
          tipoCups: 'ANATOMOPATOLOGICO',
          especimen: item.especimen.trim(),
          sospechoso: item.sospechoso?.trim() ?? '',
        }),
      );
      saved.cups = await detalleRp.save(cups);
      await qr.commitTransaction();
      return this.toResponse(saved);
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  public async actualizar(id: number, dto: GuardarRegistroMuestraDto): Promise<RegistroMuestraRes> {
    const qr = this.dynamicQR(this.auth.context);
    try {
      await qr.startTransaction();
      const registroRp = qr.manager.getRepository(FormatoMuestraAnatomopatologicaOrm);
      const detalleRp = qr.manager.getRepository(DetalleMuestraCupsOrm);
      const registro = await registroRp.findOne({ where: { id }, relations: { cups: true } });
      if (!registro) throw new NotFoundException('Registro de muestra no encontrado');

      registro.fechaTomaMuestra = dto.fechaTomaMuestra;
      registro.fechaRecepcionLaboratorio = dto.fechaRecepcionLabPatologia;
      registro.diagnostico = '';
      registro.institucionOrigen = dto.institucionOrigen.trim();
      registro.prestadorExterno = dto.prestadorExterno?.trim() ?? '';
      registro.observaciones = dto.observaciones?.trim() ?? '';
      await detalleRp.delete({ registroId: id });
      const cups = await detalleRp.save(
        dto.cupsItems.map(item =>
          detalleRp.create({
            registroId: id,
            codigoCups: item.cups.trim(),
            cantidad: item.cantidad,
            tipoCups: 'ANATOMOPATOLOGICO',
            especimen: item.especimen.trim(),
            sospechoso: item.sospechoso?.trim() ?? '',
          }),
        ),
      );
      registro.cups = cups;
      const saved = await registroRp.save(registro);
      await qr.commitTransaction();
      return this.toResponse(saved);
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  private async obtenerPacienteAutomatico(documento: string, qr: QueryRunner) {
    const paciente = await qr.manager.getRepository(PacienteOrm).findOne({
      where: { numeroDoc: documento.trim() },
      relations: { ingresos: true, detalleContrato: true },
    });
    if (!paciente) throw new NotFoundException(`No se encontró paciente con documento ${documento}`);
    const ingreso = paciente.ingresos.sort(
      (a, b) => b.fechaIngreso.getTime() - a.fechaIngreso.getTime(),
    )[0];
    return {
      numeroDocumento: paciente.numeroDoc,
      nombres: paciente.nombreCompleto,
      eps: paciente.detalleContrato?.nombre ?? '',
      ingreso: ingreso?.id,
    };
  }

  private toResponse(registro: FormatoMuestraAnatomopatologicaOrm): RegistroMuestraRes {
    const fechaToma = this.dateOnly(registro.fechaTomaMuestra);
    return {
      id: registro.id,
      numero: registro.id,
      numeroCaso: registro.numeroCaso || String(registro.id),
      fechaTomaMuestra: fechaToma,
      mesToma: new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(
        new Date(`${fechaToma}T00:00:00`),
      ),
      fechaRecepcionLabPatologia: this.dateOnly(registro.fechaRecepcionLaboratorio),
      paciente: {
        numeroDocumento: registro.numeroDocumento,
        nombres: registro.nombrePaciente,
        eps: registro.eps,
        ingreso: registro.ingreso ? Number(registro.ingreso) : undefined,
      },
      institucionOrigen: registro.institucionOrigen,
      prestadorExterno: registro.prestadorExterno || undefined,
      observaciones: registro.observaciones || undefined,
      cupsItems: (registro.cups ?? []).map(item => ({
        cups: item.codigoCups,
        cantidad: item.cantidad,
        tipoCups: item.tipoCups,
        especimen: item.especimen,
        sospechoso: item.sospechoso || '',
      })),
    };
  }

  private dateOnly(value: string | Date): string {
    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
  }
}
