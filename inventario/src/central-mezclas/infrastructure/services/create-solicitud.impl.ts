import { In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ESTADOS } from '@inn/types/inn/central-mezclas';
import {
  CtMzPacienteExternoPayload,
  CtMzSolicitudPayload,
} from '@inn/central-mezclas/presentation/dtos';
import {
  MedicamentoSeleccionOrm,
  PacienteExternoOrm,
  MedicamentoOrm,
  SolicitudOrm,
} from '@inn/orm/inn/central-mezclas';

@Injectable()
export class CreateSolicitudImpl extends BaseSource {
  public async execute(payload: CtMzSolicitudPayload): Promise<boolean> {
    await this._validateMedicamentos(payload.seleccion.map(item => item.medicamentoId));

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);
      const seleccionRp = this.qr.manager.getRepository(MedicamentoSeleccionOrm);

      const pacienteExterno = await this._resolvePacienteExterno(
        payload.pacienteExternoId,
        payload.pacienteExterno
      );

      const solicitud = solicitudRp.create({
        usuarioExternoId: this.auth.id,
        pacienteExternoId: pacienteExterno.id,
        lineaCode: payload.lineaCode,
        estadoCode: ESTADOS.RADICADA.getCode(),
        prioridadCode: payload.prioridadCode,
        fechaCreacion: new Date(),
        usuarioResponsableId: null,
        usuResObs: null,
      });

      const savedSolicitud = await solicitudRp.save(solicitud);

      const seleccion = payload.seleccion.map(item =>
        seleccionRp.create({
          medicamentoId: item.medicamentoId,
          unidadCode: item.unidadCode,
          vehiculoCode: item.vehiculoCode,
          concentracion: item.concentracion,
          volumen: item.volumen,
          cantidad: item.cantidad,
          tiempoAdmin: item.tiempoAdmin,
          uniMedTiempoAdminCode: item.uniMedTiempoAdminCode,
          viaAdministracionCode: item.viaAdministracionCode,
          fechaAplicacion: item.fechaAplicacion,
          solicitudId: savedSolicitud.id,
        })
      );

      await seleccionRp.save(seleccion);
      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }

  private async _resolvePacienteExterno(
    pacienteExternoId?: number,
    payload?: CtMzPacienteExternoPayload
  ): Promise<PacienteExternoOrm> {
    const pacienteExternoRp = this.qr.manager.getRepository(PacienteExternoOrm);

    if (pacienteExternoId) {
      const pacienteExterno = await pacienteExternoRp.findOne({ where: { id: pacienteExternoId } });
      if (!pacienteExterno) throw new Error('El paciente externo no existe');
      return pacienteExterno;
    }

    if (!payload) throw new Error('Debe enviar el paciente de la solicitud');

    const pacienteExterno = pacienteExternoRp.create({
      nombreCompleto: payload.nombreCompleto,
      numeroDocumento: payload.numeroDocumento,
      fechaNacimiento: payload.fechaNacimiento,
      cama: payload.cama,
    });

    return pacienteExternoRp.save(pacienteExterno);
  }

  private async _validateMedicamentos(medicamentosIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(medicamentosIds)];
    const medicamentoRp = this.conn.getRepository(MedicamentoOrm);
    const medicamentos = await medicamentoRp.find({ where: { id: In(uniqueIds) } });
    if (medicamentos.length !== uniqueIds.length) {
      throw new Error('Uno o varios medicamentos seleccionados no existen');
    }
  }
}
