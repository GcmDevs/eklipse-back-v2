import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { AmbulanciaFlota, ElementoVencFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota, EstadoServicioAmbulancia, TipoAmbulanciaFlota } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbulanciaView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import {
  AMBULANCIA_FLOTA_REPOSITORY,
  AmbulanciaFlotaRepository,
  ELEMENTO_VENC_FLOTA_REPOSITORY,
  ElementoVencFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { VehiculosService } from '@inn/operaciones/tanqueos/application';
import { AmbEventoService } from './amb-evento.service';

@Injectable()
export class AmbulanciaFlotaService {
  constructor(
    @Inject(AMBULANCIA_FLOTA_REPOSITORY) private readonly ambRepo: AmbulanciaFlotaRepository,
    private readonly vehiculoService: VehiculosService,
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(ELEMENTO_VENC_FLOTA_REPOSITORY) private readonly vencRepo: ElementoVencFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly eventoService: AmbEventoService,
  ) {}

  async listar(search?: string, estadoServicio?: string): Promise<AmbulanciaView[]> {
    const all = await this.ambRepo.findAll();
    const merged: AmbulanciaView[] = [];
    for (const amb of all) {
      if (estadoServicio && amb.getEstadoServicio !== estadoServicio) continue;
      const v = await this.vehiculoService.findById(amb.getVehiculoId.getValor);
      if (search && v && !v.getPlaca?.toLowerCase().includes(search.toLowerCase())) continue;
      const turno = await this.turnoRepo.findActivoByVehiculo(amb.getVehiculoId.getValor);
      merged.push({
        id: amb.getId.getValor,
        vehiculoId: amb.getVehiculoId.getValor,
        placa: v?.getPlaca,
        codigo: v?.getPlaca,
        tipoAmbulancia: amb.getTipoAmbulancia,
        estadoServicio: amb.getEstadoServicio,
        turnoActivo: turno ? { id: turno.getId.getValor, estado: turno.getEstado } : null,
      });
    }
    return merged;
  }

  /**
   * `activoId` = `VehiculoRead.id` del catálogo de vehículos.
   * Tras registrar, el módulo usa ese valor como `vehiculoId` (`AMBAMBULANCIA.VEHICULOOID`).
   */
  async registrar(activoId: number, tipoAmbulancia: TipoAmbulanciaFlota): Promise<AmbulanciaView> {
    const usuario = getUser();
    const vehiculo = await this.vehiculoService.findById(activoId);
    if (!vehiculo) throw new BadInputError('El vehículo no existe en activos');
    const existe = await this.ambRepo.findByVehiculoId(activoId);
    if (existe) throw new BadInputError('La ambulancia ya está registrada');
    return this.txManager.transactional(async () => {
      const amb = AmbulanciaFlota.create(activoId, tipoAmbulancia, usuario.id);
      const saved = await this.ambRepo.save(amb);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.AMBULANCIA,
        entidadId: saved.getId.getValor,
        tipoEvento: 'REGISTRADA',
        usuarioId: usuario.id,
        vehiculoId: activoId,
      });
      return {
        id: saved.getId.getValor,
        vehiculoId: activoId,
        placa: vehiculo.getPlaca,
        codigo: vehiculo.getPlaca,
        tipoAmbulancia,
        estadoServicio: EstadoServicioAmbulancia.EN_SERVICIO,
        turnoActivo: null,
      };
    });
  }

  async fueraServicio(vehiculoId: number, motivo: string, evidencia: string): Promise<AmbulanciaView> {
    if (!motivo?.trim() || !evidencia?.trim()) {
      throw new BadInputError('motivo y evidencia son obligatorios');
    }
    const amb = await this.requireAmb(vehiculoId);
    const turno = await this.turnoRepo.findActivoByVehiculo(vehiculoId);
    if (turno) throw new BadInputError('No puede poner fuera de servicio con turno activo o entregado');
    return this.txManager.transactional(async () => {
      amb.marcarFueraServicio();
      await this.ambRepo.update(amb);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.AMBULANCIA,
        entidadId: amb.getId.getValor,
        tipoEvento: 'FUERA_SERVICIO',
        motivo,
        detalle: { evidencia },
        vehiculoId,
      });
      return this.toView(amb, null);
    });
  }

  async enServicio(vehiculoId: number, observacion?: string): Promise<AmbulanciaView> {
    const amb = await this.requireAmb(vehiculoId);
    return this.txManager.transactional(async () => {
      amb.marcarEnServicio();
      await this.ambRepo.update(amb);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.AMBULANCIA,
        entidadId: amb.getId.getValor,
        tipoEvento: 'EN_SERVICIO',
        motivo: observacion,
        vehiculoId,
      });
      return this.toView(amb, null);
    });
  }

  async upsertVencimiento(vehiculoId: number, itemKey: string, fechaVencimiento: string): Promise<void> {
    const usuario = getUser();
    await this.requireAmb(vehiculoId);
    const existing = await this.vencRepo.findByVehiculoAndKey(vehiculoId, itemKey);
    const entity = ElementoVencFlota.upsert(
      existing?.getId.getValor,
      vehiculoId,
      itemKey,
      fechaVencimiento,
      usuario.id,
      existing?.getCreatedAt,
      new Date(),
    );
    await this.vencRepo.upsert(entity);
  }

  private async requireAmb(vehiculoId: number): Promise<AmbulanciaFlota> {
    const amb = await this.ambRepo.findByVehiculoId(vehiculoId);
    if (!amb) throw new ResourceNotFoundError('Ambulancia no registrada');
    return amb;
  }

  private async toView(amb: AmbulanciaFlota, turno: any): Promise<AmbulanciaView> {
    const v = await this.vehiculoService.findById(amb.getVehiculoId.getValor);
    return {
      id: amb.getId.getValor,
      vehiculoId: amb.getVehiculoId.getValor,
      placa: v?.getPlaca,
      codigo: v?.getPlaca,
      tipoAmbulancia: amb.getTipoAmbulancia,
      estadoServicio: amb.getEstadoServicio,
      turnoActivo: turno,
    };
  }
}
