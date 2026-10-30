import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ConflictError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import { persistRecalcDerivadosDesdeTanqueo } from '@inn/operaciones/tanqueos/application/helpers/recalc-derivados-tanqueos.persistence.helper';
import { reevaluarAlertasDatosTrasCorreccion } from '@inn/operaciones/tanqueos/application/helpers/reevaluar-alertas-datos-tras-correccion.helper';
import { getUbicacionTanqueoConfig } from '@inn/operaciones/tanqueos/domain/constants/ubicacion-tanqueo.config';
import { EstacionServicio, Tanqueo, TanqueoCorreccion } from '@inn/operaciones/tanqueos/domain/entities';
import {
  EstadoTanqueo,
  ModoValidacionUbicacion,
  OrigenTanqueo,
  UnidadMedidaCombustible,
} from '@inn/operaciones/tanqueos/domain/enums';
import {
  requiresOdometroPlausibilidad,
  validateKilometrajeTanqueo,
  validateValorPagadoPositivo,
} from '@inn/operaciones/tanqueos/domain/policies';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioRepository,
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  RepositorioCombustibleRepository,
  TANQUEO_CORRECCION_REPOSITORY,
  TANQUEO_INCONSISTENCIA_REPOSITORY,
  TANQUEO_REPOSITORY,
  TanqueoCorreccionRepository,
  TanqueoInconsistenciaRepository,
  TanqueoRepository,
  VEHICULO_REPOSITORY,
  VehiculoRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import {
  EvaluacionUbicacionTanqueoResult,
  validarUbicacionTanqueo,
} from '@inn/operaciones/tanqueos/domain/services/ubicacion-tanqueo.validator';
import { CantidadCombustible, Kilometraje, ValorMonetario } from '@inn/operaciones/tanqueos/domain/value-objects';
import { CorregirTanqueoDto } from '@inn/operaciones/tanqueos/presentation';
import { OdometroService } from './odometro.service';

@Injectable()
export class TanqueoCorreccionService {
  constructor(
    @Inject(TANQUEO_REPOSITORY) private readonly tanqueoRepository: TanqueoRepository,
    @Inject(TANQUEO_CORRECCION_REPOSITORY)
    private readonly correccionRepository: TanqueoCorreccionRepository,
    @Inject(TANQUEO_INCONSISTENCIA_REPOSITORY)
    private readonly inconsistenciaRepository: TanqueoInconsistenciaRepository,
    @Inject(ABASTECIMIENTO_REPOSITORY)
    private readonly abastecimientoRepository: AbastecimientoRepository,
    @Inject(REPOSITORIO_COMBUSTIBLE_REPOSITORY)
    private readonly repositorioRepository: RepositorioCombustibleRepository,
    @Inject(ESTACION_SERVICIO_REPOSITORY)
    private readonly estacionRepository: EstacionServicioRepository,
    @Inject(VEHICULO_REPOSITORY) private readonly vehiculoRepository: VehiculoRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly odometroService: OdometroService
  ) {}

  async corregir(tanqueoId: number, dto: CorregirTanqueoDto): Promise<void> {
    const motivo = dto.motivo?.trim();
    if (!motivo || motivo.length < 10 || motivo.length > 500) {
      throw new BadInputError('motivo debe tener entre 10 y 500 caracteres');
    }
    const cambios = dto.cambios ?? {};
    const keys = Object.keys(cambios).filter(
      k => (cambios as Record<string, unknown>)[k] !== undefined
    );
    if (!keys.length) {
      throw new BadInputError('cambios debe incluir al menos un campo');
    }

    const tanqueo = await this.tanqueoRepository.findById(tanqueoId);
    if (!tanqueo) throw new ResourceNotFoundError(`Tanqueo con id: ${tanqueoId} no encontrado`);
    if (tanqueo.getEstado === EstadoTanqueo.ANULADO) {
      throw new ConflictError('No se puede corregir un tanqueo anulado');
    }

    const usuario = getUser();
    const vehiculo = await this.vehiculoRepository.findById(tanqueo.getActivoId.getValor);
    const validaOdometro = vehiculo ? requiresOdometroPlausibilidad(vehiculo) : false;
    const umbral = vehiculo
      ? this.odometroService.umbralSalto(vehiculo, tanqueo.getRendimiento)
      : 0;
    const capacidadTanque = vehiculo?.getCapacidadAlmacenamientoCombustible ?? null;

    const correcciones: TanqueoCorreccion[] = [];
    let requiereRecalc = false;
    let nuevaEstacion: EstacionServicio | null = null;

    await this.txManager.transactional(async () => {
      if (cambios.kilometraje !== undefined) {
        validateKilometrajeTanqueo(cambios.kilometraje);
        const anterior = tanqueo.getKilometraje?.getValorEnKm ?? null;
        const nuevo = Kilometraje.create(cambios.kilometraje);
        tanqueo.replaceKilometrajeReportado(nuevo);
        correcciones.push(
          this.correccionRow({
            tanqueoId,
            campo: 'KILOMETRAJE',
            valorAnterior: anterior != null ? String(anterior) : null,
            valorNuevo: String(cambios.kilometraje),
            motivo,
            usuarioId: usuario.id,
          })
        );
        const refKm = await this.odometroService.referenciaKmAntesDelTanqueo(
          tanqueo.getActivoId.getValor,
          tanqueo.getFechaTanqueo,
          tanqueoId
        );
        const confiable = this.odometroService.isConfiable(
          cambios.kilometraje,
          refKm,
          umbral
        );
        await this.odometroService.registerAjuste({
          activoId: tanqueo.getActivoId.getValor,
          lectura: cambios.kilometraje,
          fechaLectura: new Date(),
          usuarioId: usuario.id,
          observacion: motivo,
          confiable,
          referenciaId: tanqueoId,
        });
        if (validaOdometro && refKm != null) {
          tanqueo.calculateDerivados(Kilometraje.create(refKm));
        }
        requiereRecalc = true;
      }

      if (cambios.cantidadCombustible !== undefined) {
        const unidad =
          cambios.unidadMedidaCombustible ??
          tanqueo.getCantidadCombustible?.getUnidadMedida ??
          UnidadMedidaCombustible.GALONES;
        const tipo = tanqueo.getTipoCombustible;
        if (!tipo) throw new BadInputError('El tanqueo no tiene tipo de combustible');
        const anterior = tanqueo.getCantidadCombustible?.getValor ?? null;
        const nueva = CantidadCombustible.create(
          cambios.cantidadCombustible,
          unidad,
          tipo
        );
        tanqueo.replaceCantidad(nueva);
        correcciones.push(
          this.correccionRow({
            tanqueoId,
            campo: 'CANTCOMBUST',
            valorAnterior: anterior != null ? String(anterior) : null,
            valorNuevo: String(cambios.cantidadCombustible),
            motivo,
            usuarioId: usuario.id,
          })
        );
        await this.compensarCantidadRepositorio(
          tanqueo,
          anterior ?? 0,
          cambios.cantidadCombustible,
          usuario.id
        );
        await this.actualizarAbastecimientoCantidadValor(tanqueo, tanqueoId);
        requiereRecalc = true;
      }

      if (cambios.valorTotalPagado !== undefined) {
        validateValorPagadoPositivo(cambios.valorTotalPagado);
        const anterior = tanqueo.getValorTotalPagado?.getMonto ?? null;
        tanqueo.replaceValorPagado(ValorMonetario.create(cambios.valorTotalPagado));
        correcciones.push(
          this.correccionRow({
            tanqueoId,
            campo: 'VALORPAGADO',
            valorAnterior: anterior != null ? String(anterior) : null,
            valorNuevo: String(cambios.valorTotalPagado),
            motivo,
            usuarioId: usuario.id,
          })
        );
        await this.actualizarAbastecimientoCantidadValor(tanqueo, tanqueoId);
      }

      if (cambios.estacionServicioId !== undefined) {
        const estacion = await this.estacionRepository.findById(cambios.estacionServicioId);
        if (!estacion?.getActiva) {
          throw new BadInputError('La estación no existe o no está activa');
        }
        nuevaEstacion = estacion;
        const anterior = tanqueo.getEstacionServicioId?.getValor ?? null;
        tanqueo.replaceEstacion(cambios.estacionServicioId);
        correcciones.push(
          this.correccionRow({
            tanqueoId,
            campo: 'ESTACIONOID',
            valorAnterior: anterior != null ? String(anterior) : null,
            valorNuevo: String(cambios.estacionServicioId),
            motivo,
            usuarioId: usuario.id,
          })
        );
      }

      if (cambios.fechaTanqueo !== undefined) {
        const anterior = tanqueo.getFechaTanqueo.toISOString();
        const fecha = new Date(cambios.fechaTanqueo);
        tanqueo.replaceFechaTanqueo(fecha);
        correcciones.push(
          this.correccionRow({
            tanqueoId,
            campo: 'FECHTANQUEO',
            valorAnterior: anterior,
            valorNuevo: fecha.toISOString(),
            motivo,
            usuarioId: usuario.id,
          })
        );
        requiereRecalc = true;
      }

      if (cambios.observaciones !== undefined) {
        const anterior = tanqueo.getObservaciones;
        tanqueo.replaceObservaciones(cambios.observaciones);
        correcciones.push(
          this.correccionRow({
            tanqueoId,
            campo: 'OBSERVACIONES',
            valorAnterior: anterior,
            valorNuevo: cambios.observaciones,
            motivo,
            usuarioId: usuario.id,
          })
        );
      }

      const correccionesGuardadas = await this.correccionRepository.saveMany(correcciones);

      const reevaluarKm =
        cambios.kilometraje !== undefined || cambios.fechaTanqueo !== undefined;
      const reevaluarCantidad = cambios.cantidadCombustible !== undefined;
      const reevaluarValor = cambios.valorTotalPagado !== undefined;
      const reevaluarDuplicado =
        cambios.fechaTanqueo !== undefined || cambios.valorTotalPagado !== undefined;

      // Re-evaluación de UBIC_* si cambió estacionServicioId y el tanqueo tiene datos de ubicación guardados
      const ubicacionConfig = getUbicacionTanqueoConfig();
      const snapshotPrevio = tanqueo.getValidacionUbicacion;
      const coordsGuardadas = tanqueo.getUbicacion;
      const tieneDatosUbicacionGuardados =
        coordsGuardadas !== null || snapshotPrevio !== null;

      let reevaluarUbicacion = false;
      let evaluacionUbicacion: EvaluacionUbicacionTanqueoResult | null = null;

      if (
        cambios.estacionServicioId !== undefined &&
        nuevaEstacion &&
        tieneDatosUbicacionGuardados &&
        ubicacionConfig.modo !== ModoValidacionUbicacion.OFF
      ) {
        reevaluarUbicacion = true;
        const estacionUbic = nuevaEstacion.getUbicacion;
        evaluacionUbicacion = validarUbicacionTanqueo({
          origen: tanqueo.getOrigen,
          tipoRegistro: tanqueo.getTipoRegistro,
          estacionUbicacion: estacionUbic
            ? {
                latitud: estacionUbic.getLatitud,
                longitud: estacionUbic.getLongitud,
                precisionMetros: estacionUbic.getPrecisionMetros,
              }
            : null,
          capturaFinal: coordsGuardadas
            ? {
                latitud: coordsGuardadas.getLatitud,
                longitud: coordsGuardadas.getLongitud,
                precisionMetros: coordsGuardadas.getPrecisionMetros,
                fechaCaptura: snapshotPrevio?.fechaCaptura ?? tanqueo.getFechaTanqueo,
              }
            : null,
          capturaInicial: snapshotPrevio?.ubicacionInicial ?? null,
          motivoNoDisponible: snapshotPrevio?.motivoNoDisponible ?? null,
          gpsSimulado: snapshotPrevio?.gpsSimulado ?? null,
          fechaTanqueo: tanqueo.getFechaTanqueo,
          ahora: new Date(),
          config: ubicacionConfig,
          radioMetrosOverride: ubicacionConfig.radioMetros,
        });

        if (evaluacionUbicacion.snapshot) {
          tanqueo.replaceValidacionUbicacionSnapshot(evaluacionUbicacion.snapshot);
        }
      }

      const refKmReeval =
        reevaluarKm && validaOdometro
          ? await this.odometroService.referenciaKmAntesDelTanqueo(
              tanqueo.getActivoId.getValor,
              tanqueo.getFechaTanqueo,
              tanqueoId
            )
          : null;
      const kmAnteriorReeval =
        refKmReeval != null ? Kilometraje.create(refKmReeval) : null;

      const inconsistenciasAbiertas =
        await this.inconsistenciaRepository.findAbiertasByTanqueoId(tanqueoId);

      const reeval = await reevaluarAlertasDatosTrasCorreccion({
        tanqueo,
        tanqueoId,
        usuarioId: usuario.id,
        motivoCorreccion: motivo,
        correccionesGuardadas,
        inconsistenciasAbiertas,
        validaOdometro,
        kmAnterior: kmAnteriorReeval,
        umbralSalto: umbral,
        capacidadTanque,
        tanqueoRepository: this.tanqueoRepository,
        reevaluarKm,
        reevaluarCantidad,
        reevaluarValor,
        reevaluarDuplicado,
        reevaluarUbicacion,
        evaluacionUbicacion,
        modoUbicacion: ubicacionConfig.modo,
      });

      for (const inc of reeval.inconsistenciasActualizadas) {
        await this.inconsistenciaRepository.save(inc);
      }
      if (reeval.inconsistenciasNuevas.length) {
        await this.inconsistenciaRepository.saveMany(reeval.inconsistenciasNuevas);
      }
      if (reeval.correccionesActualizadas.length) {
        await this.correccionRepository.saveMany(reeval.correccionesActualizadas);
      }

      const tieneCriticas = await this.inconsistenciaRepository.tieneCriticasAbiertas(tanqueoId);
      tanqueo.sincronizarEstadoTrasReevaluacionAlertas(tieneCriticas);

      await this.tanqueoRepository.update(tanqueo);

      if (requiereRecalc) {
        await persistRecalcDerivadosDesdeTanqueo(
          this.tanqueoRepository,
          tanqueo.getActivoId.getValor,
          tanqueoId
        );
      }
    });
  }

  private correccionRow(input: {
    tanqueoId: number;
    campo: string;
    valorAnterior: string | null;
    valorNuevo: string | null;
    motivo: string;
    usuarioId: number;
  }): TanqueoCorreccion {
    return TanqueoCorreccion.create({
      tanqueoId: input.tanqueoId,
      campo: input.campo,
      valorAnterior: input.valorAnterior,
      valorNuevo: input.valorNuevo,
      motivo: input.motivo,
      usuarioId: input.usuarioId,
      inconsistenciaId: null,
    });
  }

  private async compensarCantidadRepositorio(
    tanqueo: Tanqueo,
    cantidadAnterior: number,
    cantidadNueva: number,
    usuarioId: number
  ): Promise<void> {
    if (tanqueo.getOrigen !== OrigenTanqueo.REPOSITORIO || !tanqueo.getRepositorioId) return;
    const diff = cantidadNueva - cantidadAnterior;
    if (diff === 0) return;
    const salida = await this.repositorioRepository.findSalidaByTanqueoId(tanqueo.getId.getValor);
    if (!salida) return;
    const repo = await this.repositorioRepository.findById(tanqueo.getRepositorioId.getValor);
    if (!repo) return;
    const tanqueoId = tanqueo.getId.getValor;
    if (diff > 0) {
      repo.registerSalida(diff, usuarioId, tanqueoId);
    } else {
      repo.registerEntradaCompensatoria(
        Math.abs(diff),
        usuarioId,
        tanqueoId,
        salida.getId.getValor
      );
    }
    await this.repositorioRepository.saveWithMovimientos(repo);
  }

  private async actualizarAbastecimientoCantidadValor(
    tanqueo: Tanqueo,
    tanqueoId: number
  ): Promise<void> {
    if (tanqueo.getOrigen !== OrigenTanqueo.ESTACION) return;
    const abast = await this.abastecimientoRepository.findByTanqueoId(tanqueoId);
    if (!abast) return;
    const entrada = await this.repositorioRepository.findEntradaByAbastecimientoId(
      abast.getId.getValor
    );
    if (entrada) {
      throw new ConflictError(
        'No se corrige cantidad/valor: el abastecimiento ya alimentó un repositorio'
      );
    }
    if (tanqueo.getValorTotalPagado) {
      abast.replaceValor(tanqueo.getValorTotalPagado);
    }
    if (tanqueo.getCantidadCombustible) {
      abast.replaceCantidad(tanqueo.getCantidadCombustible);
    }
    await this.abastecimientoRepository.save(abast);
  }
}
