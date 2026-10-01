import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@core/consecutivos/application';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  commitEvidenciasTanqueo,
  validateEvidenciasStaging,
} from '@vehiculos/application/helpers';
import { Abastecimiento, RepositorioCombustible } from '@vehiculos/domain/entities';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioRepository,
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  RepositorioCombustibleRepository,
} from '@vehiculos/domain/repositories';
import {
  AbastecimientoRead,
  MovimientoCombustibleRead,
  RepositorioCombustibleRead,
} from '@vehiculos/domain/reads';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  ValorMonetario,
} from '@vehiculos/domain/value-objects';
import {
  CreateEntradaRepositorioDto,
  CreateRepositorioCombustibleDto,
} from '@vehiculos/presentation';
import { EvidenciaItem } from '../types';

@Injectable()
export class RepositorioCombustibleService {
  constructor(
    @Inject(REPOSITORIO_COMBUSTIBLE_REPOSITORY)
    private readonly repositorioRepository: RepositorioCombustibleRepository,
    @Inject(ABASTECIMIENTO_REPOSITORY)
    private readonly abastecimientoRepository: AbastecimientoRepository,
    @Inject(ESTACION_SERVICIO_REPOSITORY)
    private readonly estacionRepository: EstacionServicioRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly consecutivosService: ConsecutivoService
  ) {}

  async create(data: CreateRepositorioCombustibleDto): Promise<RepositorioCombustibleRead> {
    const repo = RepositorioCombustible.create(
      data.nombre,
      data.tipoCombustible,
      data.unidadMedidaCombustible,
      data.capacidad,
      data.stockInicial ?? 0
    );
    const saved = await this.repositorioRepository.save(repo);
    return this.repositorioRepository.findViewById(saved.getId.getValor);
  }

  async findAll(): Promise<RepositorioCombustibleRead[]> {
    return this.repositorioRepository.findAll();
  }

  async findMovimientos(id: number): Promise<MovimientoCombustibleRead[]> {
    return this.repositorioRepository.findMovimientos(id);
  }

  async registerEntrada(
    repositorioId: number,
    data: CreateEntradaRepositorioDto
  ): Promise<AbastecimientoRead> {
    const usuario = getUser();
    const repositorio = await this.repositorioRepository.findById(repositorioId);
    if (!repositorio) {
      throw new ResourceNotFoundError(`Repositorio con id: ${repositorioId} no encontrado`);
    }
    const estacion = await this.estacionRepository.findById(data.estacionServicioId);
    if (!estacion || !estacion.getActiva) {
      throw new BadInputError('La estación de servicio no existe o no está activa');
    }
    if (!repositorio.getActivo) {
      throw new BadInputError('El repositorio de combustible no está activo');
    }
    if (data.tipoCombustible !== repositorio.getTipoCombustible) {
      throw new BadInputError('El tipo de combustible no coincide con el del repositorio');
    }
    if (data.unidadMedidaCombustible !== repositorio.getUnidadMedida) {
      throw new BadInputError('La unidad de medida no coincide con la del repositorio');
    }

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

    const codigo = await this.consecutivosService.generate(
      CONSECUTIVOS_CODES.ABASTECIMIENTO_TAN
    );
    const abastecimiento = Abastecimiento.register({
      codigo,
      estacionServicioId: data.estacionServicioId,
      usuarioId: usuario.id,
      valorTotalPagado: ValorMonetario.create(data.valorPagado),
      cantidadCombustible: CantidadCombustible.create(
        data.cantidadCombustible,
        data.unidadMedidaCombustible,
        data.tipoCombustible
      ),
      tipoCombustible: data.tipoCombustible,
      fechaAbastecimiento: new Date(data.fechaAbastecimiento),
      ubicacion:
        data.latitud != null && data.longitud != null
          ? CoordenadasGPS.create(data.latitud, data.longitud, data.precisionMetros ?? null)
          : null,
      observaciones: data.observaciones ?? null,
      evidencias,
      repositorioId,
    });

    const saved = await this.txManager.transactional(async () => {
      const persistido = await this.abastecimientoRepository.save(abastecimiento);
      repositorio.registerEntrada(data.cantidadCombustible, usuario.id, persistido.getId.getValor);
      await this.repositorioRepository.saveWithMovimientos(repositorio);
      return persistido;
    });

    await this.txManager.nonTransactional(async () => {
      await commitEvidenciasTanqueo(
        this.stagingFileService,
        evidenciasItems,
        saved.getId.getValor
      );
    });

    const view = await this.abastecimientoRepository.findViewById(saved.getId.getValor);
    if (!view) {
      throw new ResourceNotFoundError('No fue posible recuperar el abastecimiento registrado');
    }
    return view;
  }
}
