import { resolveSedeDestinoFromCtxHeader } from '@common/application/helpers';
import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ConflictError, ResourceNotFoundError } from '@common/domain/errors';
import { persistRecalcDerivadosSiguiente } from '@inn/operaciones/tanqueos/application/helpers/recalc-derivados-tanqueos.persistence.helper';
import { gcmContextFactory } from '@common/domain/types';
import { getUser, switchConn } from '@common/infrastructure/services';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@inn/core/consecutivos/application';
import { StagingFileService } from '@inn/core/media/application/services/staging.archivo.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  aplicarRegistroSedeTanqueo,
  attachTanqueoDetalleReadCtx,
  attachTanqueoReadCtx,
  attachTanqueoReadCtxList,
  buildTanqueoDetalleRead,
  commitEvidenciasTanqueo,
  validateEvidenciasStaging,
} from '@inn/operaciones/tanqueos/application/helpers';
import {
  hashIdempotencyPayload,
  resolveIdempotencyHit,
} from '@inn/core/idempotency/application';
import { IDEMPOTENCY_STORE_REPOSITORY } from '@inn/core/idempotency/domain/repositories/tokens';
import { IdempotencyStoreRepository } from '@inn/core/idempotency/domain/repositories/idempotency-store.repository';
import { getUbicacionTanqueoConfig } from '@inn/operaciones/tanqueos/domain/constants/ubicacion-tanqueo.config';
import { assertReponerAuthorityIfRequired } from '@inn/operaciones/tanqueos/domain/policies/tanqueo-reponer.policies';
import { LecturaOdometro, Tanqueo, TanqueoEventoLog, TanqueoIntento } from '@inn/operaciones/tanqueos/domain/entities';
import {
  AccionEvidenciaLog,
  CanalRegistro,
  EstadoTanqueo,
  OrigenTanqueo,
  TipoRegistroTanqueo,
} from '@inn/operaciones/tanqueos/domain/enums';
import {
  assertRepositoryTanqueoRegistrationRefs,
  requiresOdometroPlausibilidad,
  validateTanqueoRegistrationKilometraje,
} from '@inn/operaciones/tanqueos/domain/policies';
import {
  ConfigUbicacionTanqueoRead,
  ResumenTanqueosRead,
  TanqueoDetalleRead,
  TanqueoRead,
} from '@inn/operaciones/tanqueos/domain/reads';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  LECTURA_ODOMETRO_REPOSITORY,
  LecturaOdometroRepository,
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  RepositorioCombustibleRepository,
  TANQUEO_CORRECCION_REPOSITORY,
  TANQUEO_EVIDENCIA_LOG_REPOSITORY,
  TANQUEO_EVENTO_LOG_REPOSITORY,
  TANQUEO_INTENTO_REPOSITORY,
  TANQUEO_REPOSITORY,
  TanqueoEventoLogRepository,
  TanqueoCorreccionRepository,
  TanqueoEvidenciaLogRepository,
  TanqueoFilters,
  TanqueoIntentoRepository,
  TanqueoRepository,
  VEHICULO_REPOSITORY,
  VehiculoRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { validarUbicacionTanqueo } from '@inn/operaciones/tanqueos/domain/services/ubicacion-tanqueo.validator';
import {
  CantidadCombustible,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
} from '@inn/operaciones/tanqueos/domain/value-objects';
import { TanqueoEvidenciaLog } from '@inn/operaciones/tanqueos/domain/entities';
import {
  CorregirTanqueoDto,
  CreateTanqueoPayloadDto,
  CreateTanqueoRepositorioRequestDto,
} from '@inn/operaciones/tanqueos/presentation';
import { randomUUID } from 'crypto';
import { EvidenciaItem } from '../types';
import { OdometroService } from './odometro.service';
import { TanqueoCorreccionService } from './tanqueo-correccion.service';

@Injectable()
export class TanqueoService {
  constructor(
    @Inject(TANQUEO_REPOSITORY)
    private readonly tanqueoRepository: TanqueoRepository,
    @Inject(VEHICULO_REPOSITORY)
    private readonly vehiculoRepository: VehiculoRepository,
    @Inject(REPOSITORIO_COMBUSTIBLE_REPOSITORY)
    private readonly repositorioRepository: RepositorioCombustibleRepository,
    @Inject(ABASTECIMIENTO_REPOSITORY)
    private readonly abastecimientoRepository: AbastecimientoRepository,
    @Inject(TANQUEO_INTENTO_REPOSITORY)
    private readonly intentoRepository: TanqueoIntentoRepository,
    @Inject(TANQUEO_EVENTO_LOG_REPOSITORY)
    private readonly eventoLogRepository: TanqueoEventoLogRepository,
    @Inject(IDEMPOTENCY_STORE_REPOSITORY)
    private readonly idempotencyStoreRepository: IdempotencyStoreRepository,
    @Inject(TANQUEO_EVIDENCIA_LOG_REPOSITORY)
    private readonly evidenciaLogRepository: TanqueoEvidenciaLogRepository,
    @Inject(LECTURA_ODOMETRO_REPOSITORY)
    private readonly lecturaOdometroRepository: LecturaOdometroRepository,
    @Inject(TANQUEO_CORRECCION_REPOSITORY)
    private readonly correccionRepository: TanqueoCorreccionRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly consecutivosService: ConsecutivoService,
    private readonly odometroService: OdometroService,
    private readonly correccionService: TanqueoCorreccionService
  ) { }

  getConfigUbicacion(): ConfigUbicacionTanqueoRead {
    const config = getUbicacionTanqueoConfig();
    return {
      modo: config.modo,
      radioMetros: config.radioMetros,
    };
  }

  async getById(id: number): Promise<TanqueoRead> {
    const view = await this.tanqueoRepository.findViewById(id);
    if (!view) throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    return attachTanqueoReadCtx(view);
  }

  async getDetalle(id: number): Promise<TanqueoDetalleRead> {
    const view = await this.getById(id);
    const [correcciones, historialEvidencias] = await Promise.all([
      this.correccionRepository.findByTanqueoId(id),
      this.evidenciaLogRepository.findByTanqueoId(id),
    ]);
    return attachTanqueoDetalleReadCtx(
      buildTanqueoDetalleRead(view, correcciones, historialEvidencias)
    );
  }

  async corregir(id: number, dto: CorregirTanqueoDto): Promise<TanqueoDetalleRead> {
    await this.correccionService.corregir(id, dto);
    return this.getDetalle(id);
  }

  async review(id: number, estadoDestino: EstadoTanqueo, motivo?: string): Promise<TanqueoRead> {
    if (
      estadoDestino !== EstadoTanqueo.VALIDADO_MANUALMENTE &&
      estadoDestino !== EstadoTanqueo.APTO_PARA_REVISION
    ) {
      throw new BadInputError('estadoDestino debe ser VALIDADO_MANUALMENTE o APTO_PARA_REVISION');
    }
    const tanqueo = await this.tanqueoRepository.findById(id);
    if (!tanqueo) throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    tanqueo.review(getUser().id, estadoDestino, motivo);
    await this.txManager.transactional(async () => {
      await this.tanqueoRepository.changeEstado(tanqueo);
    });
    const view = await this.tanqueoRepository.findViewById(id);
    if (!view) throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    return attachTanqueoReadCtx(view);
  }

  async getAll(page: number, limit: number, filters?: TanqueoFilters) {
    const [items, count] = await this.tanqueoRepository.findAllAndCount(page, limit, filters);
    return [attachTanqueoReadCtxList(items), count] as [TanqueoRead[], number];
  }

  async getAllSedes(page: number, limit: number, filters?: TanqueoFilters) {
    return this.tanqueoRepository.findAllSedesAndCount(page, limit, filters);
  }

  async getResumen(filters?: TanqueoFilters): Promise<ResumenTanqueosRead> {
    return this.tanqueoRepository.getResumen(filters);
  }

  async getResumenAllSedes(filters?: TanqueoFilters): Promise<ResumenTanqueosRead> {
    return this.tanqueoRepository.getResumenAllSedes(filters);
  }

  async createFromRepositorio(
    request: CreateTanqueoRepositorioRequestDto,
    idempotencyKey: string,
    hasReponerAuthority: boolean,
    hasRegistrarTransversalAuthority: boolean
  ): Promise<TanqueoRead> {
    const usuario = getUser();
    const data = request.tanqueo;
    const tipoRegistro = data.tipoRegistro ?? TipoRegistroTanqueo.CONDUCTOR;

    assertReponerAuthorityIfRequired(hasReponerAuthority, {
      tipoRegistro,
      conductorRealOid: data.conductorRealOid,
    });

    const sedeDestino = resolveSedeDestinoFromCtxHeader(usuario.context.getCode());
    const plan = await aplicarRegistroSedeTanqueo({
      contextoSesion: usuario.context.getCode(),
      sedeDestino,
      hasRegistrarTransversal: hasRegistrarTransversalAuthority,
      registradoPorId: usuario.id,
      items: [data],
    });

    const requestHash = hashIdempotencyPayload({
      request,
      usuarioId: usuario.id,
    });

    const run = async (): Promise<TanqueoRead> => {
      const cached = await this.idempotencyStoreRepository.findByKey(idempotencyKey);
      const hit = resolveIdempotencyHit<TanqueoRead>(cached, requestHash);
      if (hit.hit) return attachTanqueoReadCtx(hit.value);

      try {
        const view = await this.executeCreateFromRepositorio(
          data,
          request.canalRegistro,
          usuario.id
        );
        await this.idempotencyStoreRepository.save(
          idempotencyKey,
          requestHash,
          JSON.stringify(view),
          48
        );
        return view;
      } catch (error) {
        await this.persistIntentoFallido({
          usuarioId: usuario.id,
          operacion: 'REGISTRAR_TANQUEO_REPOSITORIO',
          payload: request,
          canalRegistro: request.canalRegistro,
          error: error,
        });
        throw error;
      }
    };

    if (plan.esTransversal) {
      const destinoDs = switchConn(gcmContextFactory(plan.sedeEfectiva));
      return this.txManager.transactionalOn(destinoDs, run);
    }
    return this.txManager.transactional(async () => attachTanqueoReadCtx(await run()));
  }

  private async executeCreateFromRepositorio(
    data: CreateTanqueoPayloadDto,
    canalRegistro: CanalRegistro,
    usuarioId: number
  ): Promise<TanqueoRead> {
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

    if (data.motivoFechaRetroactiva !== undefined) {
      throw new BadInputError('motivoFechaRetroactiva no está soportado');
    }

    validateTanqueoRegistrationKilometraje(activo, data.kilometraje);
    const validaOdometro = requiresOdometroPlausibilidad(activo);
    const umbral = this.odometroService.umbralSalto(activo);

    const tipoRegistro = data.tipoRegistro ?? TipoRegistroTanqueo.CONDUCTOR;
    const observaciones = data.observaciones ?? null;
    const fechaTanqueo =
      tipoRegistro === TipoRegistroTanqueo.CONDUCTOR
        ? new Date()
        : data.fechaTanqueo
          ? new Date(data.fechaTanqueo)
          : new Date();

    const referenciaKm = await this.odometroService.referenciaKmAntesDelTanqueo(
      data.activoId,
      fechaTanqueo,
      null
    );

    const kilometraje = data.kilometraje != null ? Kilometraje.create(data.kilometraje) : null;
    const kilometrajeAnterior =
      validaOdometro && referenciaKm != null ? Kilometraje.create(referenciaKm) : null;

    const codigo = await this.consecutivosService.generate(CONSECUTIVOS_CODES.TANQUEOS);
    const tanqueo = Tanqueo.register({
      codigo,
      activoId: data.activoId,
      registradoPorId: usuarioId,
      tipoRegistro,
      canalRegistro,
      conductorRealId: data.conductorRealOid,
      origen: OrigenTanqueo.REPOSITORIO,
      repositorioId: data.repositorioId,
      kilometraje,
      valorTotalPagado: null,
      cantidadCombustible: CantidadCombustible.create(
        data.cantidadCombustible,
        data.unidadMedidaCombustible,
        data.tipoCombustible
      ),
      tipoCombustible: data.tipoCombustible,
      estacionServicioId: null,
      fechaTanqueo,
      ubicacion: null,
      observaciones,
      evidencias,
      origenRegistro: OrigenRegistro.create({
        clienteUuid: randomUUID(),
        creadoOffline: false,
        fechaCreacionLocal: new Date(),
        dispositivoId: canalRegistro === CanalRegistro.WEB ? 'SERVIDOR' : 'MOVIL',
      }),
    });
    tanqueo.registerInconsistenciasDeEvidencia();
    tanqueo.registerInconsistenciaCapacidad(activo.getCapacidadAlmacenamientoCombustible);
    if (validaOdometro && kilometraje && kilometrajeAnterior) {
      tanqueo.registerInconsistenciaKilometraje(kilometrajeAnterior, umbral);
      tanqueo.calculateDerivados(kilometrajeAnterior);
    }

    const ubicacionConfig = getUbicacionTanqueoConfig();
    const evaluacionUbicacion = validarUbicacionTanqueo({
      origen: OrigenTanqueo.REPOSITORIO,
      tipoRegistro,
      fechaTanqueo,
      ahora: new Date(),
      config: ubicacionConfig,
    });
    tanqueo.applyValidacionUbicacion(evaluacionUbicacion, ubicacionConfig.modo);

    tanqueo.sealEstadoInicial();

    const saved = await this.txManager.transactional(async () => {
      const persistido = await this.tanqueoRepository.saveWithInconsistencias(tanqueo);
      repositorio.registerSalida(data.cantidadCombustible, usuarioId, persistido.getId.getValor);
      await this.repositorioRepository.saveWithMovimientos(repositorio);
      if (persistido.getKilometraje) {
        const refAlMomento = await this.odometroService.referenciaKmAntesDelTanqueo(
          data.activoId,
          persistido.getFechaTanqueo,
          persistido.getId.getValor
        );
        const confiable =
          validaOdometro &&
          this.odometroService.isConfiable(
            persistido.getKilometraje.getValorEnKm,
            refAlMomento,
            umbral
          );
        await this.odometroService.registerLecturaTanqueo({
          activoId: data.activoId,
          tanqueoId: persistido.getId.getValor,
          lectura: persistido.getKilometraje.getValorEnKm,
          fechaLectura: persistido.getFechaTanqueo,
          usuarioId,
          confiable: validaOdometro ? confiable : false,
          observacion: null,
        });
      }
      for (const item of evidenciasItems) {
        await this.evidenciaLogRepository.save(
          TanqueoEvidenciaLog.create({
            usuarioId,
            tanqueoId: persistido.getId.getValor,
            tipoEvidencia: item.tipo,
            accion: item.omitida ? AccionEvidenciaLog.OMITIDA : AccionEvidenciaLog.AGREGADA,
            mediaNuevoId: item.omitida ? null : item.mediaId,
            motivo: item.motivoOmision,
          })
        );
      }
      return persistido;
    });

    await this.txManager.nonTransactional(async () => {
      await commitEvidenciasTanqueo(this.stagingFileService, evidenciasItems, saved.getId.getValor);
    });

    const view = await this.tanqueoRepository.findViewById(saved.getId.getValor);
    if (!view) {
      throw new ResourceNotFoundError('No fue posible recuperar el tanqueo registrado');
    }
    return attachTanqueoReadCtx(view);
  }

  async voidRecord(id: number, motivo: string): Promise<TanqueoRead> {
    const tanqueo = await this.tanqueoRepository.findById(id);
    if (!tanqueo) throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    const usuario = getUser();
    tanqueo.voidRecord(usuario.id, motivo);

    await this.txManager.transactional(async () => {
      if (tanqueo.getOrigen === OrigenTanqueo.REPOSITORIO && tanqueo.getRepositorioId) {
        const salida = await this.repositorioRepository.findSalidaByTanqueoId(id);
        if (salida) {
          const yaCompensado = await this.repositorioRepository.existsCompensacion(
            salida.getId.getValor
          );
          if (yaCompensado) {
            throw new ConflictError('El movimiento de salida ya fue compensado');
          }
          const repo = await this.repositorioRepository.findById(tanqueo.getRepositorioId.getValor);
          const cantidad = tanqueo.getCantidadCombustible?.getValor ?? salida.getCantidad;
          repo.registerEntradaCompensatoria(cantidad, usuario.id, id, salida.getId.getValor);
          await this.repositorioRepository.saveWithMovimientos(repo);
        }
      }

      if (tanqueo.getOrigen === OrigenTanqueo.ESTACION) {
        const view = await this.tanqueoRepository.findViewById(id);
        if (view?.abastecimientoId) {
          const entrada = await this.repositorioRepository.findEntradaByAbastecimientoId(
            view.abastecimientoId
          );
          if (entrada) {
            throw new ConflictError(
              'No se anula el tanqueo de estación: el abastecimiento ya alimentó un repositorio (pendiente de negocio #1)'
            );
          }
          const abast = await this.abastecimientoRepository.findById(view.abastecimientoId);
          if (abast) {
            abast.voidRecord(usuario.id, motivo);
            await this.abastecimientoRepository.save(abast);
          }
        }
      }

      const lectura = await this.lecturaOdometroRepository.findByTanqueoId(id);
      await this.odometroService.registerAjuste({
        activoId: tanqueo.getActivoId.getValor,
        lectura: tanqueo.getKilometraje?.getValorEnKm ?? 0,
        fechaLectura: new Date(),
        usuarioId: usuario.id,
        observacion: `ANULACION TANQUEO ${tanqueo.getCodigo}: ${motivo}`,
        confiable: false,
        referenciaId: lectura?.getId.getValor ?? id,
      });

      await this.tanqueoRepository.changeEstado(tanqueo);
      await persistRecalcDerivadosSiguiente(
        this.tanqueoRepository,
        tanqueo.getActivoId.getValor,
        id
      );
    });

    const view = await this.tanqueoRepository.findViewById(id);
    if (!view) throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    return attachTanqueoReadCtx(view);
  }

  async listIntentosPendientes(page: number, limit: number) {
    return this.intentoRepository.findPendientes(page, limit);
  }

  async recuperarIntento(id: number, tanqueoId: number) {
    const intento = await this.intentoRepository.findById(id);
    if (!intento) throw new ResourceNotFoundError(`Intento ${id} no encontrado`);
    const tanqueo = await this.tanqueoRepository.findById(tanqueoId);
    if (!tanqueo) {
      throw new BadInputError('tanqueoId no válido: el tanqueo no existe');
    }
    const clienteUuid = intento.getClienteUuid;
    if (clienteUuid) {
      const duplicado = await this.tanqueoRepository.findByClienteUuid(clienteUuid);
      if (duplicado && duplicado.id !== tanqueoId) {
        throw new ConflictError(
          `Ya existe un tanqueo con clienteUuid ${clienteUuid} (id ${duplicado.id})`
        );
      }
    }
    intento.markRecuperado(getUser().id, tanqueoId);
    return this.intentoRepository.save(intento);
  }

  async limpiarIntentosPendientes(observacion?: string): Promise<{ eliminados: number }> {
    const usuario = getUser();
    const now = new Date();
    const yaEjecutado = await this.eventoLogRepository.existsLimpiezaIntentosInMonth(
      now.getFullYear(),
      now.getMonth() + 1
    );
    if (yaEjecutado) {
      throw new ConflictError('La limpieza de intentos pendientes ya se ejecutó este mes');
    }

    return this.txManager.transactional(async () => {
      const eliminados = await this.intentoRepository.deleteAllPendientes();
      await this.eventoLogRepository.save(
        TanqueoEventoLog.createLimpiezaIntentos(usuario.id, eliminados, observacion)
      );
      return { eliminados };
    });
  }

  async ajustarOdometro(input: {
    activoId: number;
    lectura: number;
    fechaLectura: string;
    observacion: string;
    referenciaId?: number;
  }): Promise<LecturaOdometro> {
    const activo = await this.vehiculoRepository.findById(input.activoId);
    if (!activo) {
      throw new ResourceNotFoundError(`Vehículo con id: ${input.activoId} no encontrado`);
    }
    const usuarioId = getUser().id;
    return this.txManager.transactional(() =>
      this.odometroService.registerAjuste({
        activoId: input.activoId,
        lectura: input.lectura,
        fechaLectura: new Date(input.fechaLectura),
        usuarioId,
        observacion: input.observacion,
        confiable: true,
        referenciaId: input.referenciaId,
      })
    );
  }

  private async persistIntentoFallido(input: {
    usuarioId: number;
    operacion: string;
    payload: unknown;
    canalRegistro: CanalRegistro;
    error: unknown;
    clienteUuid?: string;
    idempotencyKey?: string;
    dispositivoId?: string;
  }): Promise<void> {
    try {
      const error = input.error as { codigo?: string; message?: string };
      const intento = TanqueoIntento.createFailed({
        usuarioId: input.usuarioId,
        operacion: input.operacion,
        payload: input.payload,
        canalRegistro: input.canalRegistro,
        clienteUuid: input.clienteUuid,
        idempotencyKey: input.idempotencyKey,
        dispositivoId: input.dispositivoId,
        errorCodigo: error?.codigo ?? error?.constructor?.name,
        errorMensaje: error?.message ?? String(input.error),
      });
      await this.txManager.nonTransactional(() => this.intentoRepository.save(intento));
    } catch {
      return;
    }
  }
}
