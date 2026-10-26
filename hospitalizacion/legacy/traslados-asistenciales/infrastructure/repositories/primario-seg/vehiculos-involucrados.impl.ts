import { Injectable } from '@nestjs/common';
import { TrasladoVehiculoInvolucradoOrm } from '@hpn/lgc/tas/orm/gcn';
import { VehiculoInvolucradoDto } from '@hpn/lgc/tas/presentation/dtos';
import { RecursosCompartidosSource } from '../../services';

@Injectable()
export class VehiculosInvolucradosImpl extends RecursosCompartidosSource {
  private getVehiculoValues(body: VehiculoInvolucradoDto) {
    return {
      fuga: body.fuga,
      noIdentificado: body.noIdentificado,
      placa: body.noIdentificado ? null : body.placa?.trim(),
      tipo: body.tipoCode,
      marca: body.marca ?? null,
      color: body.color ?? null,
      conductor: body.conductor ?? null,
      documento: body.documento ?? null,
      celular: body.celular ?? null,
      direccion: body.direccion ?? null,
      barrio: body.barrio ?? null,
    };
  }

  public async create(trasladoId: number, body: VehiculoInvolucradoDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioEditableOrFail(trasladoId);
      this.ensureAccident(traslado);
      this.validateVehiculo(body);
      const accidente = await this.getOrCreateAccident(trasladoId);
      const repository = this.qr.manager.getRepository(TrasladoVehiculoInvolucradoOrm);
      const vehiculo = await repository.save(
        repository.create({
          ...this.getVehiculoValues(body),
          accidenteId: accidente.id,
          usuarioId: this.auth.id,
          fechaCreacion: new Date(),
        })
      );
      return { trasladoId, vehiculoId: vehiculo.id, result: true };
    });
  }

  public async update(trasladoId: number, vehiculoId: number, body: VehiculoInvolucradoDto) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioEditableOrFail(trasladoId);
      this.ensureAccident(traslado);
      this.validateVehiculo(body);
      const accidente = await this.getAccidenteOrFail(trasladoId);
      const vehiculo = await this.getVehiculoOrFail(accidente.id, vehiculoId);
      Object.assign(vehiculo, this.getVehiculoValues(body));
      await this.qr.manager.getRepository(TrasladoVehiculoInvolucradoOrm).save(vehiculo);
      return { trasladoId, vehiculoId, result: true };
    });
  }

  public async delete(trasladoId: number, vehiculoId: number) {
    return this.inTransaction(async () => {
      const traslado = await this.getPrimarioEditableOrFail(trasladoId);
      this.ensureAccident(traslado);
      const accidente = await this.getAccidenteOrFail(trasladoId);
      const vehiculo = await this.getVehiculoOrFail(accidente.id, vehiculoId);
      await this.qr.manager.getRepository(TrasladoVehiculoInvolucradoOrm).remove(vehiculo);
      return { trasladoId, vehiculoId, result: true };
    });
  }
}
