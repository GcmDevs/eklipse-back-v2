import { GcmContexts } from '@common/application/constants';
import { resolveSedeDestinoFromCtxHeader } from '@common/application/helpers';
import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError } from '@common/domain/errors';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@inn/core/consecutivos/application';
import { StagingFileService } from '@inn/core/media/application/services/staging.archivo.service';
import { gcmContextFactory } from '@common/domain/types';
import { getUser, switchConn } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import {
  aplicarRegistroSedeTanqueo,
  aplicarValidacionKmTanqueoItem,
  commitEvidenciasTanqueoBatch,
  validateEvidenciasStaging,
} from '@inn/operaciones/tanqueos/application/helpers';
import {
  Abastecimiento,
  EstacionServicio,
  EvidenciaSinResolverError,
  SyncLog,
  Tanqueo,
  TanqueoIntento,
  Vehiculo,
} from '@inn/operaciones/tanqueos/domain/entities';
import {
  EstadoVehiculo,
  OrigenTanqueo,
  ResultadoSync,
  TipoRegistroTanqueo,
} from '@inn/operaciones/tanqueos/domain/enums';
import { getUbicacionTanqueoConfig } from '@inn/operaciones/tanqueos/domain/constants/ubicacion-tanqueo.config';
import { validarUbicacionTanqueo } from '@inn/operaciones/tanqueos/domain/services/ubicacion-tanqueo.validator';
import { hashIdempotencyPayload, resolveIdempotencyHit } from '@inn/core/idempotency/application';
import { IDEMPOTENCY_STORE_REPOSITORY } from '@inn/core/idempotency/domain/repositories/tokens';
import { IdempotencyStoreRepository } from '@inn/core/idempotency/domain/repositories/idempotency-store.repository';
import { assertReponerAuthorityIfRequired } from '@inn/operaciones/tanqueos/domain/policies/tanqueo-reponer.policies';
import { OdometroService } from './odometro.service';
import {
  requiresOdometroPlausibilidad,
  EVIDENCIAS_ABASTECIMIENTO,
  EVIDENCIAS_LOTE_ESTACION,
  FACTOR_VALOR_ALTO,
  MIN_MUESTRA_VALOR_ALTO,
  validateKilometrajeTanqueo,
  validateTanqueoItemEstacion,
  validateUbicacionTanqueoItemPayload,
  VENTANA_DUPLICADO_MINUTOS,
} from '@inn/operaciones/tanqueos/domain/policies';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioRepository,
  SYNC_LOG_REPOSITORY,
  SyncLogRepository,
  TANQUEO_INTENTO_REPOSITORY,
  TANQUEO_REPOSITORY,
  TanqueoIntentoRepository,
  TanqueoRepository,
  VEHICULO_REPOSITORY,
  VehiculoRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
  ValorMonetario,
} from '@inn/operaciones/tanqueos/domain/value-objects';
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
    @Inject(TANQUEO_INTENTO_REPOSITORY)
    private readonly intentoRepository: TanqueoIntentoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly consecutivosService: ConsecutivoService,
    private readonly odometroService: OdometroService
  ) { }

  async execute(
    input: SincronizarLote,
    hasReponerAuthority: boolean,
    hasRegistrarTransversalAuthority: boolean
  ): Promise<ResultadoItemSync[]> {
    const usuario = getUser();
    const sedeDestino = resolveSedeDestinoFromCtxHeader(usuario.context.getCode());
    const plan = await aplicarRegistroSedeTanqueo({
      contextoSesion: usuario.context.getCode(),
      sedeDestino,
      hasRegistrarTransversal: hasRegistrarTransversalAuthority,
      registradoPorId: input.usuarioId,
      items: input.tanqueos,
    });

    const run = () => this.executeEnSede(input, hasReponerAuthority, plan.sedeEfectiva);

    if (plan.esTransversal) {
      const destinoDs = switchConn(gcmContextFactory(plan.sedeEfectiva));
      return this.txManager.transactionalOn(destinoDs, run);
    }
    return this.txManager.transactional(run);
  }

  private async executeEnSede(
    input: SincronizarLote,
    hasReponerAuthority: boolean,
    sedeEfectiva: GcmContexts
  ): Promise<ResultadoItemSync[]> {
    const requestHash = hashIdempotencyPayload({
      tanqueos: input.tanqueos,
      canalRegistro: input.canalRegistro,
      sedeEfectiva,
    });
    const previo = await this.idempotencyStoreRepository.findByKey(input.idempotencyKey);
    const hit = resolveIdempotencyHit<ResultadoItemSync[]>(previo, requestHash);
    if (hit.hit) return hit.value;

    for (const item of input.tanqueos) {
      assertReponerAuthorityIfRequired(hasReponerAuthority, {
        tipoRegistro: item.tipoRegistro,
        conductorRealOid: item.conductorRealOid,
      });
    }

    const ubicacionConfig = getUbicacionTanqueoConfig();
    const resultados: ResultadoItemSync[] = [];
    const tanqueosNuevos: Tanqueo[] = [];
    const itemsPorClienteUuid = new Map<string, TanqueoItem>();
    const clienteUuidEnLote = new Set<string>();
    const vehiculosPorId = new Map<number, Vehiculo | null>();
    const estacionesPorId = new Map<number, EstacionServicio | null>();

    for (const item of input.tanqueos) {
      if (clienteUuidEnLote.has(item.clienteUuid)) {
        resultados.push({
          clienteUuid: item.clienteUuid,
          estado: 'DUPLICADO',
          codigo: '',
        });
        continue;
      }
      clienteUuidEnLote.add(item.clienteUuid);
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

      let estacion: EstacionServicio | null = null;
      if (item.estacionServicioId != null) {
        estacion = await this.resolveEstacion(
          item.estacionServicioId,
          estacionesPorId
        );
        if (!estacion || !estacion.getActiva) {
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

      const requiresKm = requiresOdometroPlausibilidad(vehiculo);

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
        validateUbicacionTanqueoItemPayload({
          latitud: item.latitud,
          longitud: item.longitud,
          precisionMetros: item.precisionMetros,
          fechaCapturaUbicacion: item.fechaCapturaUbicacion,
          ubicacionInicial: item.ubicacionInicial,
          ubicacionNoDisponibleMotivo: item.ubicacionNoDisponibleMotivo,
        });
      } catch (error) {
        if (error instanceof BadInputError) {
          await this.failOrReject(input, item.clienteUuid, error.message, resultados);
          continue;
        }
        throw error;
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
        const tipoRegistro = item.tipoRegistro ?? TipoRegistroTanqueo.CONDUCTOR;
        const tanqueo = Tanqueo.register({
          codigo,
          activoId: item.activoId,
          registradoPorId: input.usuarioId,
          tipoRegistro,
          canalRegistro: input.canalRegistro,
          conductorRealId: item.conductorRealOid,
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
        tanqueo.registerInconsistenciaValorAlto(
          muestra >= MIN_MUESTRA_VALOR_ALTO ? promedio : null,
          FACTOR_VALOR_ALTO
        );
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

        const estacionUbic = estacion?.getUbicacion;
        const evaluacionUbicacion = validarUbicacionTanqueo({
          origen: OrigenTanqueo.ESTACION,
          tipoRegistro,
          estacionUbicacion: estacionUbic
            ? {
              latitud: estacionUbic.getLatitud,
              longitud: estacionUbic.getLongitud,
              precisionMetros: estacionUbic.getPrecisionMetros,
            }
            : null,
          capturaFinal:
            item.latitud != null && item.longitud != null
              ? {
                latitud: item.latitud,
                longitud: item.longitud,
                precisionMetros: item.precisionMetros ?? null,
                fechaCaptura: item.fechaCapturaUbicacion ?? null,
              }
              : null,
          capturaInicial: item.ubicacionInicial
            ? {
              latitud: item.ubicacionInicial.latitud,
              longitud: item.ubicacionInicial.longitud,
              precisionMetros: item.ubicacionInicial.precisionMetros ?? null,
              fechaCaptura: item.ubicacionInicial.fechaCaptura ?? null,
            }
            : null,
          motivoNoDisponible: item.ubicacionNoDisponibleMotivo ?? null,
          gpsSimulado: item.gpsSimulado ?? null,
          fechaTanqueo: item.fechaTanqueo,
          ahora: new Date(),
          config: ubicacionConfig,
        });
        tanqueo.applyValidacionUbicacion(evaluacionUbicacion, ubicacionConfig.modo);

        tanqueo.sealEstadoInicial();
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
      const requiresKm = vehiculo ? requiresOdometroPlausibilidad(vehiculo) : false;
      const sorted = [...tanqueosDelVehiculo].sort(
        (a, b) => a.getFechaTanqueo.getTime() - b.getFechaTanqueo.getTime()
      );
      const capacidadTanque = vehiculo?.getCapacidadAlmacenamientoCombustible ?? null;
      const umbral = vehiculo ? this.odometroService.umbralSalto(vehiculo) : 0;
      for (const tanqueo of sorted) {
        if (requiresKm && tanqueo.getKilometraje) {
          const refKm = await this.odometroService.referenciaKmAntesDelTanqueo(
            vehiculoId,
            tanqueo.getFechaTanqueo,
            null
          );
          aplicarValidacionKmTanqueoItem(tanqueo, refKm, umbral, requiresKm);
        }
        tanqueo.registerInconsistenciaCapacidad(capacidadTanque);
        tanqueo.sealEstadoInicial();
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

      for (const tanqueo of guardados) {
        if (!tanqueo.getKilometraje) continue;
        const vehiculo = vehiculosPorId.get(tanqueo.getActivoId.getValor);
        const valida = vehiculo ? requiresOdometroPlausibilidad(vehiculo) : false;
        const referenciaKm = await this.odometroService.referenciaKmAntesDelTanqueo(
          tanqueo.getActivoId.getValor,
          tanqueo.getFechaTanqueo,
          tanqueo.getId.getValor
        );
        const umbral = vehiculo ? this.odometroService.umbralSalto(vehiculo) : 0;
        await this.odometroService.registerLecturaTanqueo({
          activoId: tanqueo.getActivoId.getValor,
          tanqueoId: tanqueo.getId.getValor,
          lectura: tanqueo.getKilometraje.getValorEnKm,
          fechaLectura: tanqueo.getFechaTanqueo,
          usuarioId: input.usuarioId,
          confiable: valida
            ? this.odometroService.isConfiable(
              tanqueo.getKilometraje.getValorEnKm,
              referenciaKm,
              umbral
            )
            : false,
        });
      }

      return guardados;
    });

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
      requestHash,
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

  private async resolveEstacion(
    estacionServicioId: number,
    cache: Map<number, EstacionServicio | null>
  ): Promise<EstacionServicio | null> {
    if (!cache.has(estacionServicioId)) {
      const estacion = await this.estacionRepository.findById(estacionServicioId);
      cache.set(estacionServicioId, estacion ?? null);
    }
    return cache.get(estacionServicioId) ?? null;
  }

  private async failOrReject(
    input: SincronizarLote,
    clienteUuid: string,
    motivo: string,
    resultados: ResultadoItemSync[]
  ): Promise<void> {
    await this.persistIntentoFallido(input, clienteUuid, motivo);
    if (!input.creadoOffline) {
      throw new BadInputError(motivo);
    }
    resultados.push({ clienteUuid, estado: 'RECHAZADO', motivo });
    await this.registerLog(clienteUuid, null, input, ResultadoSync.RECHAZADO, motivo);
  }

  private async persistIntentoFallido(
    input: SincronizarLote,
    clienteUuid: string,
    motivo: string
  ): Promise<void> {
    try {
      const intento = TanqueoIntento.createFailed({
        usuarioId: input.usuarioId,
        operacion: 'SINCRONIZAR_LOTE',
        payload: { clienteUuid, lote: input },
        canalRegistro: input.canalRegistro,
        clienteUuid,
        idempotencyKey: input.idempotencyKey,
        dispositivoId: input.dispositivoId,
        errorCodigo: 'SYNC_ITEM_RECHAZADO',
        errorMensaje: motivo,
      });
      await this.txManager.nonTransactional(() => this.intentoRepository.save(intento));
    } catch {
      return;
    }
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
}
