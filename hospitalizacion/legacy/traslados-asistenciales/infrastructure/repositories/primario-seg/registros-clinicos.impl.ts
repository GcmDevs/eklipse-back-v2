import { Injectable } from '@nestjs/common';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import {
  MedicamentoOrm,
  ProcedimientoOrm,
  TrasladoNotaOrm,
  TrasladoSignosVitalesOrm,
} from '@hpn/lgc/tas/orm/gcn';
import {
  MedicamentoSegmentadoDto,
  NotaSegmentadaDto,
  ProcedimientoSegmentadoDto,
  SignosVitalesSegmentadoDto,
} from '@hpn/lgc/tas/presentation/dtos';
import { RecursosCompartidosSource } from '../../services';

@Injectable()
export class RegistrosClinicosImpl extends RecursosCompartidosSource {
  private async getRegistroOrFail<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    trasladoId: number,
    registroId: number,
    descripcion: string
  ): Promise<T> {
    const registro = await this.qr.manager
      .getRepository(entity)
      .createQueryBuilder('registro')
      .where('registro.id = :registroId', { registroId })
      .andWhere('registro.trasladoId = :trasladoId', { trasladoId })
      .getOne();

    if (!registro) {
      throw new Error(`${descripcion} ${registroId} no pertenece al traslado ${trasladoId}`);
    }
    return registro;
  }

  private async getContextoEditable(trasladoId: number) {
    await this.getPrimarioEditableOrFail(trasladoId);
    return this.getTramoPrincipalOrFail(trasladoId);
  }

  public async createSignosVitalesRegistro(trasladoId: number, body: SignosVitalesSegmentadoDto) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(body.fechaRegistro, 'La fecha de signos vitales', tramo);
      const registro = await super.createSignosVitales(trasladoId, tramo.id, body, 1, this.qr);
      return { trasladoId, registroId: registro.id, result: true };
    });
  }

  public async updateSignosVitales(
    trasladoId: number,
    registroId: number,
    body: SignosVitalesSegmentadoDto
  ) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(body.fechaRegistro, 'La fecha de signos vitales', tramo);
      const repository = this.qr.manager.getRepository(TrasladoSignosVitalesOrm);
      const registro = await this.getRegistroOrFail(
        TrasladoSignosVitalesOrm,
        trasladoId,
        registroId,
        'El registro de signos vitales'
      );
      Object.assign(registro, {
        fc: body.fc,
        fr: body.fr,
        ta: body.ta,
        sat: body.sato2,
        fcf: body.fcf,
        temp: body.temp ?? null,
        talla: body.talla ?? null,
        peso: body.peso ?? null,
        glasgow: body.glasgow,
        observacion: body.observacion ?? null,
        fechaRegistro: new Date(body.fechaRegistro),
      });
      await repository.save(registro);
      return { trasladoId, registroId, result: true };
    });
  }

  public async deleteSignosVitales(trasladoId: number, registroId: number) {
    return this.deleteRegistro(
      TrasladoSignosVitalesOrm,
      trasladoId,
      registroId,
      'El registro de signos vitales'
    );
  }

  public async createNota(trasladoId: number, body: NotaSegmentadaDto) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(body.fechaHoraRegistro, 'La fecha de la nota', tramo);
      const [registro] = await super.createNotas(trasladoId, tramo.id, [body], this.qr);
      return { trasladoId, registroId: registro.id, result: true };
    });
  }

  public async updateNota(trasladoId: number, registroId: number, body: NotaSegmentadaDto) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(body.fechaHoraRegistro, 'La fecha de la nota', tramo);
      const repository = this.qr.manager.getRepository(TrasladoNotaOrm);
      const registro = await this.getRegistroOrFail(
        TrasladoNotaOrm,
        trasladoId,
        registroId,
        'La nota'
      );
      registro.nota = body.nota;
      registro.fechaRegistro = new Date(body.fechaHoraRegistro);
      await repository.save(registro);
      return { trasladoId, registroId, result: true };
    });
  }

  public async deleteNota(trasladoId: number, registroId: number) {
    return this.deleteRegistro(TrasladoNotaOrm, trasladoId, registroId, 'La nota');
  }

  public async createProcedimiento(trasladoId: number, body: ProcedimientoSegmentadoDto) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(
        body.fechaHoraRegistro,
        'La fecha del procedimiento',
        tramo
      );
      const [registro] = await super.createProcedimientos(trasladoId, tramo.id, [body], this.qr);
      return { trasladoId, registroId: registro.id, result: true };
    });
  }

  public async updateProcedimiento(
    trasladoId: number,
    registroId: number,
    body: ProcedimientoSegmentadoDto
  ) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(
        body.fechaHoraRegistro,
        'La fecha del procedimiento',
        tramo
      );
      const repository = this.qr.manager.getRepository(ProcedimientoOrm);
      const registro = await this.getRegistroOrFail(
        ProcedimientoOrm,
        trasladoId,
        registroId,
        'El procedimiento'
      );
      registro.procedimientoId = body.isTemporal ? null : body.id;
      registro.ekprocedimientoId = body.isTemporal ? body.id : null;
      registro.fechaRegistro = new Date(body.fechaHoraRegistro);
      await repository.save(registro);
      return { trasladoId, registroId, result: true };
    });
  }

  public async deleteProcedimiento(trasladoId: number, registroId: number) {
    return this.deleteRegistro(ProcedimientoOrm, trasladoId, registroId, 'El procedimiento');
  }

  public async createMedicamento(trasladoId: number, body: MedicamentoSegmentadoDto) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(
        body.fechaHoraRegistro,
        'La fecha del medicamento',
        tramo
      );
      const [registro] = await super.createMedicamentos(trasladoId, tramo.id, [body], this.qr);
      return { trasladoId, registroId: registro.id, result: true };
    });
  }

  public async updateMedicamento(
    trasladoId: number,
    registroId: number,
    body: MedicamentoSegmentadoDto
  ) {
    return this.inTransaction(async () => {
      const tramo = await this.getContextoEditable(trasladoId);
      this.validateFechaClinicaSegmentado(
        body.fechaHoraRegistro,
        'La fecha del medicamento',
        tramo
      );
      const repository = this.qr.manager.getRepository(MedicamentoOrm);
      const registro = await this.getRegistroOrFail(
        MedicamentoOrm,
        trasladoId,
        registroId,
        'El medicamento'
      );
      registro.medicamentoId = body.id;
      registro.dosis = body.dosis;
      registro.via = body.via;
      registro.fechaRegistro = new Date(body.fechaHoraRegistro);
      await repository.save(registro);
      return { trasladoId, registroId, result: true };
    });
  }

  public async deleteMedicamento(trasladoId: number, registroId: number) {
    return this.deleteRegistro(MedicamentoOrm, trasladoId, registroId, 'El medicamento');
  }

  private async deleteRegistro<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    trasladoId: number,
    registroId: number,
    descripcion: string
  ) {
    return this.inTransaction(async () => {
      await this.getPrimarioEditableOrFail(trasladoId);
      const registro = await this.getRegistroOrFail(entity, trasladoId, registroId, descripcion);
      await this.qr.manager.getRepository(entity).remove(registro);
      return { trasladoId, registroId, result: true };
    });
  }
}
