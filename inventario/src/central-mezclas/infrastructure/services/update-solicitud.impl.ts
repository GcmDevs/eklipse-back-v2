import { In, IsNull } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ESTADOS, LINEAS } from '@inn/types/inn/central-mezclas';
import {
  CtMzNutricionParenteralPayload,
  CtMzPacienteExternoPayload,
  CtMzReempaqueReenvasePayload,
  CtMzSolicitudPayload,
} from '@inn/central-mezclas/presentation/dtos';
import {
  MedicamentoOrm,
  MedicamentoSeleccionOrm,
  NutricionParenteralOrm,
  PacienteExternoOrm,
  SolicitudOrm,
} from '@inn/orm/inn/central-mezclas';
import { PacienteOrm } from '@inn/orm/gen';
import { IngresoOrm } from '@inn/orm/adn';
import { EstanciaOrm } from '@inn/orm/hpn';

@Injectable()
export class UpdateSolicitudImpl extends BaseSource {
  public async execute(solicitudId: number, payload: CtMzSolicitudPayload): Promise<boolean> {
    await this._validatePayload(payload);

    const isOncologico = payload.lineaCode === LINEAS.ONCOLOGICO.getCode();

    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const solicitudRp = this.qr.manager.getRepository(SolicitudOrm);
      const seleccionRp = this.qr.manager.getRepository(MedicamentoSeleccionOrm);
      const nutricionParenteralRp = this.qr.manager.getRepository(NutricionParenteralOrm);

      const solicitud = await solicitudRp.findOne({ where: { id: solicitudId } });
      if (!solicitud) throw new Error('La solicitud no existe');
      if (solicitud.estadoCode !== ESTADOS.RECHAZADA.getCode()) {
        throw new Error('Solo se puede actualizar una solicitud rechazada');
      }

      const pacienteExterno = await this._resolvePacienteExterno(
        payload.pacienteExternoId,
        payload.pacienteExterno
      );

      solicitud.pacienteExternoId = pacienteExterno.id;
      solicitud.lineaCode = payload.lineaCode;
      solicitud.prioridadCode = payload.prioridadCode;

      await solicitudRp.save(solicitud);
      await seleccionRp.delete({ solicitudId: solicitud.id });
      await nutricionParenteralRp.delete({ solicitudId: solicitud.id });

      if (this._isMedicamentoSeleccionLine(payload.lineaCode)) {
        const seleccion = payload.seleccion.map(item =>
          seleccionRp.create({
            medicamentoId: item.medicamentoId,
            vehiculoCode: item.vehiculoCode,
            concentracion: item.concentracion,
            volumen: item.volumen,
            cantidad: item.cantidad,
            tiempoAdmin: isOncologico ? item.tiempoAdmin : null,
            uniMedTiempoAdminCode: isOncologico ? item.uniMedTiempoAdminCode : null,
            viaAdministracionCode: item.viaAdministracionCode,
            fechaAplicacion: isOncologico ? item.fechaAplicacion : null,
            solicitudId: solicitud.id,
          })
        );

        await seleccionRp.save(seleccion);
      }

      if (payload.lineaCode === LINEAS.NUTRICION_PARENTERAL.getCode()) {
        const nutricionParenteral = nutricionParenteralRp.create({
          ...payload.nutricionParenteral,
          solicitudId: solicitud.id,
        });

        await nutricionParenteralRp.save(nutricionParenteral);
      }

      if (payload.lineaCode === LINEAS.REEMPAQUE_REENVASE.getCode()) {
        const reempaqueReenvase = seleccionRp.create({
          medicamentoId: payload.reempaqueReenvase.medicamentoId,
          viaAdministracionCode: payload.reempaqueReenvase.viaAdministracionCode,
          laboratorio: payload.reempaqueReenvase.laboratorio,
          cantidadAdecuar: payload.reempaqueReenvase.cantidadAdecuar,
          lote: payload.reempaqueReenvase.lote,
          fechaVencimiento: payload.reempaqueReenvase.fechaVencimiento,
          solicitudId: solicitud.id,
        });

        await seleccionRp.save(reempaqueReenvase);
      }

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (this.qr.isTransactionActive) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (!this.qr.isReleased) await this.qr.release();
    }
  }

  private async _validatePayload(payload: CtMzSolicitudPayload): Promise<void> {
    if (this._isMedicamentoSeleccionLine(payload.lineaCode)) {
      if (!payload.seleccion?.length) {
        throw new Error('Debe enviar al menos un medicamento para la solicitud');
      }

      await this._validateMedicamentos(payload.seleccion.map(item => item.medicamentoId));
    }

    if (payload.lineaCode === LINEAS.NUTRICION_PARENTERAL.getCode()) {
      this._validateNutricionParenteral(payload.nutricionParenteral);
    }

    if (payload.lineaCode === LINEAS.REEMPAQUE_REENVASE.getCode()) {
      this._validateReempaqueReenvase(payload.reempaqueReenvase);
      await this._validateMedicamentos([payload.reempaqueReenvase.medicamentoId]);
    }
  }

  private async _resolvePacienteExterno(
    pacienteExternoId?: number,
    payload?: CtMzPacienteExternoPayload
  ): Promise<PacienteExternoOrm> {
    const pacienteExternoRp = this.qr.manager.getRepository(PacienteExternoOrm);
    const pacienteRp = this.qr.manager.getRepository(PacienteOrm);
    const ingresoRp = this.qr.manager.getRepository(IngresoOrm);
    const estanciaRp = this.qr.manager.getRepository(EstanciaOrm);

    let pacienteExterno: PacienteExternoOrm;
    let ultimaEstancia: EstanciaOrm | null = null;

    if (pacienteExternoId) {
      const paciente = await pacienteRp.findOne({ where: { id: pacienteExternoId } });
      if (!paciente) throw new Error('El paciente no existe');

      const ultimoIngreso = await ingresoRp.findOne({
        where: { pacienteId: paciente.id },
        order: { fechaIngreso: 'DESC' },
      });

      if (ultimoIngreso) {
        ultimaEstancia = await estanciaRp.findOne({
          where: { ingresoId: ultimoIngreso?.id, fechaEgreso: IsNull() },
          relations: ['cama'],
          order: { fechaIngreso: 'DESC' },
        });
      }

      pacienteExterno = pacienteExternoRp.create({
        pacienteId: paciente.id,
        estanciaId: ultimaEstancia ? ultimaEstancia.id : null,
      });
    } else {
      if (!payload) throw new Error('Debe enviar el paciente de la solicitud');

      pacienteExterno = pacienteExternoRp.create({
        nombreCompleto: payload.nombreCompleto,
        numeroDocumento: payload.numeroDocumento,
        fechaNacimiento: payload.fechaNacimiento,
        cama: payload.cama,
      });
    }

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

  private _isMedicamentoSeleccionLine(lineaCode: number): boolean {
    return (
      lineaCode === LINEAS.ONCOLOGICO.getCode() || lineaCode === LINEAS.NO_ONCOLOGICO.getCode()
    );
  }

  private _validateNutricionParenteral(payload?: CtMzNutricionParenteralPayload): void {
    if (!payload) {
      throw new Error('Debe enviar la informacion de nutricion parenteral');
    }
  }

  private _validateReempaqueReenvase(payload?: CtMzReempaqueReenvasePayload): void {
    if (!payload) {
      throw new Error('Debe enviar la informacion de reempaque/reenvase');
    }
  }
}
