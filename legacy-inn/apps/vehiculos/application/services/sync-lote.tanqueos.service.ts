import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError } from '@common/domain/errors';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@core/consecutivos/application';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  commitEvidenciasTanqueoBatch,
  sortAndValidateSecuenciaKilometraje,
  validateEvidenciasStaging,
} from '@vehiculos/application/helpers';
import {
  Abastecimiento,
  EvidenciaSinResolverError,
  SyncLog,
  Tanqueo,
  Vehiculo,
} from '@vehiculos/domain/entities';
import { EstadoVehiculo, OrigenTanqueo, ResultadoSync } from '@vehiculos/domain/enums';
import {
  appliesKilometrajeValidation,
  EVIDENCIAS_ABASTECIMIENTO,
  EVIDENCIAS_LOTE_ESTACION,
  FACTOR_VALOR_ALTO,
  MIN_MUESTRA_VALOR_ALTO,
  validateKilometrajeTanqueo,
  validateTanqueoItemEstacion,
  VENTANA_DUPLICADO_MINUTOS,
} from '@vehiculos/domain/policies';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioRepository,
  IDEMPOTENCY_STORE_REPOSITORY,
  IdempotencyStoreRepository,
  SYNC_LOG_REPOSITORY,
  SyncLogRepository,
  TANQUEO_REPOSITORY,
  TanqueoRepository,
  VEHICULO_REPOSITORY,
  VehiculoRepository,
} from '@vehiculos/domain/repositories';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
  ValorMonetario,
} from '@vehiculos/domain/value-objects';
import { EvidenciaItem, ResultadoItemSync, SincronizarLote, TanqueoItem } from '../types';

@Injectable()
export class SincronizarLoteTanqueosUseCase {
  constructor(
    @Inject(TANQUEO_REPOSITORY)
    private readonly tanqueoRepo: TanqueoRepository,
    @Inject(ABASTECIMIENTO_REPOSITORY)
    private readonly abastecimientoRepository: AbastecimientoRepository,
    @Inject(VEHICULO_REPOSITORY)
    private readonly vehiculoRepository: VehiculoRepository,
    @Inject(ESTACION_SERVICIO_REPOSITORY)
    private readonly estacionRepository: EstacionServicioRepository,
    @Inject(SYNC_LOG_REPOSITORY)
    private readonly syncLogRepository: SyncLogRepository,
    @Inject(IDEMPOTENCY_STORE_REPOSITORY)
    private readonly idempotencyStoreRepository: IdempotencyStoreRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly consecutivosService: ConsecutivoService
  ) {}

  async execute(input: SincronizarLote): Promise<ResultadoItemSync[]> {
    const previo = await this.idempotencyStoreRepository.findByKey(input.idempotencyKey);
    if (previo) return JSON.parse(previo.responseBody);

    const resultados: ResultadoItemSync[] = [];
    const tanqueosNuevos: Tanqueo[] = [];
    const itemsPorClienteUuid = new Map<string, TanqueoItem>();
    const vehiculosPorId = new Map<number, Vehiculo | null>();
    const estacionesPorId = new Map<number, boolean>();

    for (const item of input.tanqueos) {
      itemsPorClienteUuid.set(item.clienteUuid, item);

      const existente = await this.tanqueoRepo.findByClienteUuid(item.clienteUuid);
      if (existente) {
        resultados.push({
          clienteUuid: item.clienteUuid,
          estado: 'DUPLICADO',
          codigo: existente.codigo ?? '',
        });
        await this.registerLog(
          item.clienteUuid,
          existente.id,
          input,
          ResultadoSync.DUPLICADO,
          `Ya existe con codigo ${existente.codigo}`
        );
        continue;
      }

      const vehiculo = await this.resolveVehiculo(item.activoId, vehiculosPorId);
      if (!vehiculo || vehiculo.getEstado !== EstadoVehiculo.ACTIVA) {
        await this.failOrReject(
          input,
          item.clienteUuid,
          'El vehículo o máquina no existe o no está activo',
          resultados
        );
        continue;
      }

      if (item.estacionServicioId != null) {
        const estacionValida = await this.resolveEstacionActiva(
          item.estacionServicioId,
          estacionesPorId
        );
        if (!estacionValida) {
          await this.failOrReject(
            input,
            item.clienteUuid,
            'La estacion de servicio no existe o no esta activa',
            resultados
          );
          continue;
        }
      }

      const evidencias = this.generateEvidencias(item.evidencias);
      const faltantes = evidencias.findTiposSinResolver(EVIDENCIAS_LOTE_ESTACION);
      if (faltantes.length > 0) {
        const motivo = `Faltan evidencias sin resolver (ni capturadas ni omitidas): ${faltantes.join(
          ', '
        )}`;
        await this.failOrReject(input, item.clienteUuid, motivo, resultados);
        continue;
      }

      try {
        await validateEvidenciasStaging(this.stagingFileService, item.evidencias);
      } catch (error) {
        if (error instanceof BadInputError) {
          await this.failOrReject(input, item.clienteUuid, error.message, resultados);
          continue;
        }
        throw error;
      }

      const requiresKm = appliesKilometrajeValidation(vehiculo.getTipoActivo);

      try {
        validateTanqueoItemEstacion({
          estacionServicioId: item.estacionServicioId,
          valorTotalPagado: item.valorTotalPagado,
          cantidadCombustible: item.cantidadCombustible,
          unidadMedidaCombustible: item.unidadMedidaCombustible,
          kilometraje: item.kilometraje,
          requiresKilometraje: requiresKm,
        });
        if (!requiresKm && item.kilometraje != null) {
          validateKilometrajeTanqueo(item.kilometraje);
        }
      } catch (error) {
        if (error instanceof BadInputError) {
          await this.failOrReject(input, item.clienteUuid, error.message, resultados);
          continue;
        }
        throw error;
      }

      if (
        requiresKm &&
        !input.creadoOffline &&
        vehiculo.getKilometrajeActual != null &&
        item.kilometraje != null &&
        item.kilometraje < vehiculo.getKilometrajeActual
      ) {
        throw new BadInputError(
          `El kilometraje (${item.kilometraje} km) es menor al ultimo registrado (${vehiculo.getKilometrajeActual} km)`
        );
      }

      const tipoCombustible = item.tipoCombustible ?? vehiculo.getTipoCombustible ?? null;
      if (!tipoCombustible) {
        await this.failOrReject(
          input,
          item.clienteUuid,
          'El tipo de combustible es requerido: el vehículo o máquina no tiene uno registrado',
          resultados
        );
        continue;
      }

      try {
        const codigo = await this.generateFolio(item.fechaTanqueo);
        const valorPagado = ValorMonetario.createTanqueoEstacion(item.valorTotalPagado);
        const tanqueo = Tanqueo.register({
          codigo,
          activoId: item.activoId,
          usuarioId: input.usuarioId,
          origen: OrigenTanqueo.ESTACION,
          kilometraje:
            requiresKm && item.kilometraje != null ? Kilometraje.create(item.kilometraje) : null,
          valorTotalPagado: valorPagado,
          cantidadCombustible:
            item.cantidadCombustible && item.unidadMedidaCombustible
              ? CantidadCombustible.create(
                  item.cantidadCombustible,
                  item.unidadMedidaCombustible,
                  tipoCombustible
                )
              : null,
          tipoCombustible,
          estacionServicioId: item.estacionServicioId,
          fechaTanqueo: item.fechaTanqueo,
          ubicacion:
            item.latitud != null && item.longitud != null
              ? CoordenadasGPS.create(item.latitud, item.longitud, item.precisionMetros)
              : null,
          observaciones: item.observaciones,
          evidencias,
          origenRegistro: OrigenRegistro.create({
            clienteUuid: item.clienteUuid,
            creadoOffline: input.creadoOffline,
            fechaCreacionLocal: item.fechaCreacionLocal,
            dispositivoId: input.dispositivoId,
          }),
          loteEstacion: true,
        });

        tanqueo.registerInconsistenciasDeEvidencia();

        const { promedio, muestra } = await this.tanqueoRepo.getPromedioValorPorActivo(
          item.activoId
        );
        if (muestra >= MIN_MUESTRA_VALOR_ALTO) {
          tanqueo.registerInconsistenciaValorAlto(promedio, FACTOR_VALOR_ALTO);
        }
        const duplicado = await this.tanqueoRepo.existsDuplicadoSospechoso({
          activoId: item.activoId,
          valorPagado: valorPagado.getMonto,
          fechaTanqueo: item.fechaTanqueo,
          ventanaMinutos: VENTANA_DUPLICADO_MINUTOS,
          excludeClienteUuid: item.clienteUuid,
        });
        if (duplicado) {
          tanqueo.registerInconsistenciaDuplicadoSospechoso();
        }

        tanqueosNuevos.push(tanqueo);
      } catch (error) {
        if (error instanceof EvidenciaSinResolverError) {
          await this.failOrReject(input, item.clienteUuid, error.message, resultados);
          continue;
        }
        throw error;
      }
    }

    const porVehiculo = this.sortPorVehiculo(tanqueosNuevos);
    for (const [vehiculoId, tanqueosDelVehiculo] of porVehiculo) {
      const vehiculo = vehiculosPorId.get(vehiculoId);
      const requiresKm = vehiculo ? appliesKilometrajeValidation(vehiculo.getTipoActivo) : false;
      const kmActual = requiresKm ? (vehiculo?.getKilometrajeActual ?? null) : null;
      const capacidadTanque = vehiculo?.getCapacidadAlmacenamientoCombustible ?? null;
      const kilometrajeInicial =
        requiresKm && kmActual != null ? Kilometraje.create(kmActual) : null;

      const ordenados = sortAndValidateSecuenciaKilometraje(
        tanqueosDelVehiculo,
        kilometrajeInicial,
        !input.creadoOffline,
        requiresKm
      );
      ordenados.forEach(t => t.registerInconsistenciaCapacidad(capacidadTanque));
      if (!requiresKm || !vehiculo) continue;
      const ultimoConKm = [...ordenados].reverse().find(t => t.getKilometraje);
      const nuevoKm = ultimoConKm?.getKilometraje?.getValorEnKm;
      if (
        nuevoKm != null &&
        (vehiculo.getKilometrajeActual == null || nuevoKm > vehiculo.getKilometrajeActual)
      ) {
        vehiculo.updateKilometraje(nuevoKm);
      }
    }

    for (const tanqueo of tanqueosNuevos) tanqueo.confirmRegistro();

    const codigosAbastecimientoPorCliente = new Map<string, string>();
    for (const tanqueo of tanqueosNuevos) {
      const item = itemsPorClienteUuid.get(tanqueo.getOrigenRegistro.getClienteUuid);
      if (!item || item.estacionServicioId == null || !tanqueo.getTipoCombustible) continue;
      codigosAbastecimientoPorCliente.set(
        item.clienteUuid,
        await this.consecutivosService.generate(CONSECUTIVOS_CODES.ABASTECIMIENTO_TAN)
      );
    }

    const tanqueosGuardados = await this.txManager.transactional(async () => {
      const guardados = await this.tanqueoRepo.saveMany(tanqueosNuevos);

      for (const tanqueo of guardados) {
        const item = itemsPorClienteUuid.get(tanqueo.getOrigenRegistro.getClienteUuid);
        if (!item) continue;
        const evidencias = this.generateEvidencias(item.evidencias);
        const tipoCombustible = tanqueo.getTipoCombustible;
        if (!tipoCombustible || item.estacionServicioId == null) continue;
        const codigoAbastecimiento = codigosAbastecimientoPorCliente.get(item.clienteUuid);
        if (!codigoAbastecimiento) continue;
        const abastecimiento = Abastecimiento.register({
          codigo: codigoAbastecimiento,
          estacionServicioId: item.estacionServicioId,
          usuarioId: input.usuarioId,
          valorTotalPagado: ValorMonetario.createTanqueoEstacion(item.valorTotalPagado),
          cantidadCombustible:
            item.cantidadCombustible && item.unidadMedidaCombustible
              ? CantidadCombustible.create(
                  item.cantidadCombustible,
                  item.unidadMedidaCombustible,
                  tipoCombustible
                )
              : null,
          tipoCombustible,
          fechaAbastecimiento: item.fechaTanqueo,
          ubicacion:
            item.latitud != null && item.longitud != null
              ? CoordenadasGPS.create(item.latitud, item.longitud, item.precisionMetros)
              : null,
          observaciones: item.observaciones,
          evidencias: evidencias.extract(EVIDENCIAS_ABASTECIMIENTO),
          tanqueoId: tanqueo.getId.getValor,
          clienteUuid: item.clienteUuid,
        });
        await this.abastecimientoRepository.save(abastecimiento);
      }

      return guardados;
    });

    for (const [vehiculoId, vehiculo] of vehiculosPorId) {
      if (!vehiculo || !porVehiculo.has(vehiculoId)) continue;
      try {
        await this.vehiculoRepository.update(vehiculo);
      } catch (error) {
        throw error;
      }
    }

    await this.txManager.nonTransactional(async () => {
      await commitEvidenciasTanqueoBatch(
        this.stagingFileService,
        tanqueosGuardados.map(tanqueo => ({
          tanqueoId: tanqueo.getId.getValor,
          evidencias:
            itemsPorClienteUuid.get(tanqueo.getOrigenRegistro.getClienteUuid)?.evidencias ?? [],
        }))
      );
    });

    for (const tanqueo of tanqueosGuardados) {
      const tanqueoView = await this.tanqueoRepo.findViewById(tanqueo.getId.getValor);
      if (!tanqueoView) {
        throw new BadInputError(
          `No fue posible recuperar el tanqueo registrado (${tanqueo.getCodigo})`
        );
      }
      resultados.push({
        clienteUuid: tanqueo.getOrigenRegistro.getClienteUuid,
        estado: 'REGISTRADO',
        tanqueo: tanqueoView,
      });
      await this.registerLog(
        tanqueo.getOrigenRegistro.getClienteUuid,
        tanqueo.getId.getValor,
        input,
        ResultadoSync.OK
      );
    }

    await this.idempotencyStoreRepository.save(
      input.idempotencyKey,
      this.hashDe(resultados),
      JSON.stringify(resultados),
      48
    );

    return resultados;
  }

  private async resolveVehiculo(
    vehiculoId: number,
    cache: Map<number, Vehiculo | null>
  ): Promise<Vehiculo | null> {
    if (!cache.has(vehiculoId)) {
      cache.set(vehiculoId, await this.vehiculoRepository.findById(vehiculoId));
    }
    return cache.get(vehiculoId) ?? null;
  }

  private async resolveEstacionActiva(
    estacionServicioId: number,
    cache: Map<number, boolean>
  ): Promise<boolean> {
    if (!cache.has(estacionServicioId)) {
      const estacion = await this.estacionRepository.findById(estacionServicioId);
      cache.set(estacionServicioId, !!estacion && estacion.getActiva);
    }
    return cache.get(estacionServicioId) ?? false;
  }

  private async failOrReject(
    input: SincronizarLote,
    clienteUuid: string,
    motivo: string,
    resultados: ResultadoItemSync[]
  ): Promise<void> {
    if (!input.creadoOffline) {
      throw new BadInputError(motivo);
    }
    resultados.push({ clienteUuid, estado: 'RECHAZADO', motivo });
    await this.registerLog(clienteUuid, null, input, ResultadoSync.RECHAZADO, motivo);
  }

  private async generateFolio(_fechaTanqueo: Date): Promise<string> {
    return this.consecutivosService.generate(CONSECUTIVOS_CODES.TANQUEOS);
  }

  private generateEvidencias(items: EvidenciaItem[]): EvidenciasTanqueo {
    return items.reduce(
      (acc, item) =>
        item.omitida
          ? acc.omit(item.tipo, item.motivoOmision)
          : acc.capture(item.tipo, item.mediaId as number),
      EvidenciasTanqueo.empty()
    );
  }

  private sortPorVehiculo(tanqueos: Tanqueo[]): Map<number, Tanqueo[]> {
    const mapa = new Map<number, Tanqueo[]>();
    for (const tanqueo of tanqueos) {
      const lista = mapa.get(tanqueo.getActivoId.getValor) ?? [];
      lista.push(tanqueo);
      mapa.set(tanqueo.getActivoId.getValor, lista);
    }
    return mapa;
  }

  private async registerLog(
    clienteUuid: string,
    tanqueoId: number | null,
    comando: SincronizarLote,
    resultado: ResultadoSync,
    detalle?: string
  ): Promise<void> {
    const syncLog = SyncLog.create(
      clienteUuid,
      tanqueoId,
      comando.usuarioId,
      comando.dispositivoId,
      resultado,
      detalle
    );
    await this.syncLogRepository.save(syncLog);
  }

  private hashDe(valor: unknown): string {
    return Buffer.from(JSON.stringify(valor)).toString('base64').slice(0, 64);
  }
}
