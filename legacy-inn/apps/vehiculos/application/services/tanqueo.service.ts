import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@core/consecutivos/application';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { Inject, Injectable } from '@nestjs/common';
import { commitEvidenciasTanqueo, validateEvidenciasStaging } from '@vehiculos/application/helpers';
import { Tanqueo, Vehiculo } from '@vehiculos/domain/entities';
import { OrigenTanqueo } from '@vehiculos/domain/enums';
import {
  appliesKilometrajeValidation,
  assertRepositoryTanqueoRegistrationRefs,
  validateTanqueoRegistrationKilometraje,
} from '@vehiculos/domain/policies';
import { ResumenTanqueosRead, TanqueoRead } from '@vehiculos/domain/reads';
import {
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  RepositorioCombustibleRepository,
  TANQUEO_REPOSITORY,
  TanqueoFilters,
  TanqueoRepository,
  VEHICULO_REPOSITORY,
  VehiculoRepository,
} from '@vehiculos/domain/repositories';
import {
  CantidadCombustible,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
} from '@vehiculos/domain/value-objects';
import { CreateTanqueoDto } from '@vehiculos/presentation';
import { randomUUID } from 'crypto';
import { EvidenciaItem } from '../types';

@Injectable()
export class TanqueoService {
  constructor(
    @Inject(TANQUEO_REPOSITORY)
    private readonly tanqueoRepository: TanqueoRepository,
    @Inject(VEHICULO_REPOSITORY)
    private readonly vehiculoRepository: VehiculoRepository,
    @Inject(REPOSITORIO_COMBUSTIBLE_REPOSITORY)
    private readonly repositorioRepository: RepositorioCombustibleRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly consecutivosService: ConsecutivoService
  ) {}

  async getAll(
    page: number,
    limit: number,
    filters?: TanqueoFilters
  ): Promise<[TanqueoRead[], number]> {
    return this.tanqueoRepository.findAllAndCount(page, limit, filters);
  }

  async getAllSedes(
    page: number,
    limit: number,
    filters?: TanqueoFilters
  ): Promise<[TanqueoRead[], number]> {
    return this.tanqueoRepository.findAllSedesAndCount(page, limit, filters);
  }

  async getResumen(filters?: TanqueoFilters): Promise<ResumenTanqueosRead> {
    return this.tanqueoRepository.getResumen(filters);
  }

  async getResumenAllSedes(filters?: TanqueoFilters): Promise<ResumenTanqueosRead> {
    return this.tanqueoRepository.getResumenAllSedes(filters);
  }

  async createFromRepositorio(data: CreateTanqueoDto): Promise<TanqueoRead> {
    const usuario = getUser();
    const activoRaw = await this.vehiculoRepository.findById(data.activoId);
    const repositorioRaw = await this.repositorioRepository.findById(data.repositorioId);
    const { activo, repositorio } = assertRepositoryTanqueoRegistrationRefs(
      activoRaw,
      repositorioRaw
    );
    repositorio.validateTanqueoSupplyCompatibility(
      data.tipoCombustible,
      data.unidadMedidaCombustible,
      data.cantidadCombustible
    );

    const evidenciasItems: EvidenciaItem[] = data.evidencias.map(e => ({
      tipo: e.tipo,
      omitida: e.omitida,
      mediaId: e.mediaId ?? null,
      motivoOmision: e.motivoOmision ?? null,
    }));
    await validateEvidenciasStaging(this.stagingFileService, evidenciasItems);
    const evidencias = evidenciasItems.reduce(
      (acc, item) =>
        item.omitida
          ? acc.omit(item.tipo, item.motivoOmision)
          : acc.capture(item.tipo, item.mediaId as number),
      EvidenciasTanqueo.empty()
    );

    const tipoCombustible = data.tipoCombustible;
    validateTanqueoRegistrationKilometraje(activo, data.kilometraje);

    const requiresKm = appliesKilometrajeValidation(activo.getTipoActivo);

    const kilometraje =
      requiresKm && data.kilometraje != null ? Kilometraje.create(data.kilometraje) : null;
    const kilometrajeAnterior =
      requiresKm && activo.getKilometrajeActual != null
        ? Kilometraje.create(activo.getKilometrajeActual)
        : null;

    const codigo = await this.consecutivosService.generate(CONSECUTIVOS_CODES.TANQUEOS);
    const tanqueo = Tanqueo.register({
      codigo,
      activoId: data.activoId,
      usuarioId: usuario.id,
      origen: OrigenTanqueo.REPOSITORIO,
      repositorioId: data.repositorioId,
      kilometraje,
      valorTotalPagado: null,
      cantidadCombustible: CantidadCombustible.create(
        data.cantidadCombustible,
        data.unidadMedidaCombustible,
        tipoCombustible
      ),
      tipoCombustible,
      estacionServicioId: null,
      fechaTanqueo: new Date(data.fechaTanqueo),
      ubicacion: null,
      observaciones: data.observaciones ?? null,
      evidencias,
      origenRegistro: OrigenRegistro.create({
        clienteUuid: randomUUID(),
        creadoOffline: false,
        fechaCreacionLocal: new Date(),
        dispositivoId: 'SERVIDOR',
      }),
    });
    tanqueo.registerInconsistenciasDeEvidencia();
    tanqueo.registerInconsistenciaCapacidad(activo.getCapacidadAlmacenamientoCombustible);
    if (kilometraje && kilometrajeAnterior) {
      tanqueo.registerInconsistenciaKilometraje(kilometrajeAnterior);
      tanqueo.calculateDerivados(kilometrajeAnterior);
    }

    const saved = await this.txManager.transactional(async () => {
      const persistido = await this.tanqueoRepository.saveWithInconsistencias(tanqueo);
      repositorio.registerSalida(data.cantidadCombustible, usuario.id, persistido.getId.getValor);
      await this.repositorioRepository.saveWithMovimientos(repositorio);
      return persistido;
    });

    if (requiresKm && saved.getKilometraje) {
      const nuevoKm = saved.getKilometraje.getValorEnKm;
      if (activo.getKilometrajeActual == null || nuevoKm > activo.getKilometrajeActual) {
        activo.updateKilometraje(nuevoKm);
        await this.syncKilometraje(activo);
      }
    }

    await this.txManager.nonTransactional(async () => {
      await commitEvidenciasTanqueo(this.stagingFileService, evidenciasItems, saved.getId.getValor);
    });

    const view = await this.tanqueoRepository.findViewById(saved.getId.getValor);
    if (!view) {
      throw new ResourceNotFoundError('No fue posible recuperar el tanqueo registrado');
    }
    return view;
  }

  async approve(id: number, motivo?: string): Promise<TanqueoRead> {
    const tanqueo = await this.tanqueoRepository.findById(id);
    if (!tanqueo) {
      throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    }
    const usuario = getUser();
    tanqueo.approve(usuario.id, motivo);
    await this.txManager.transactional(async () => {
      await this.tanqueoRepository.changeEstado(tanqueo);
    });
    return this.tanqueoRepository.findViewById(id);
  }

  async reject(id: number, motivo: string): Promise<TanqueoRead> {
    if (!motivo || motivo.trim().length === 0) {
      throw new BadInputError('El motivo de rechazo es requerido');
    }
    const tanqueo = await this.tanqueoRepository.findById(id);
    if (!tanqueo) {
      throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    }
    const usuario = getUser();
    tanqueo.reject(usuario.id, motivo);
    await this.txManager.transactional(async () => {
      await this.tanqueoRepository.changeEstado(tanqueo);
    });

    const activo = await this.vehiculoRepository.findById(tanqueo.getActivoId.getValor);
    if (activo && appliesKilometrajeValidation(activo.getTipoActivo)) {
      const kmAprobado = await this.tanqueoRepository.findUltimoKilometrajeAprobado(
        activo.getId.getValor
      );
      activo.replaceKilometrajeActual(kmAprobado);
      await this.syncKilometraje(activo);
    }

    return this.tanqueoRepository.findViewById(id);
  }

  private async syncKilometraje(activo: Vehiculo): Promise<void> {
    try {
      await this.vehiculoRepository.update(activo);
    } catch (error) {
      throw Error(`No se pudo actualizar el kilometraje del activo ${activo.getId.getValor}`);
    }
  }
}
