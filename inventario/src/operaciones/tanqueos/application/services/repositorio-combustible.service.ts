import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { EstadoAbastecimiento } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { getUser } from '@common/infrastructure/services';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@inn/core/consecutivos/application';
import { StagingFileService } from '@inn/core/media/application/services/staging.archivo.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  commitEvidenciasTanqueo,
  validateEvidenciasStaging,
} from '@inn/operaciones/tanqueos/application/helpers';
import { Abastecimiento, RepositorioCombustible } from '@inn/operaciones/tanqueos/domain/entities';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  ESTACION_SERVICIO_REPOSITORY,
  EstacionServicioRepository,
  REPOSITORIO_COMBUSTIBLE_REPOSITORY,
  RepositorioCombustibleRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import {
  AbastecimientoRead,
  MovimientoCombustibleRead,
  RepositorioCombustibleRead,
} from '@inn/operaciones/tanqueos/domain/reads';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  ValorMonetario,
} from '@inn/operaciones/tanqueos/domain/value-objects';
import {
  CreateEntradaRepositorioDto,
  CreateRepositorioCombustibleDto,
} from '@inn/operaciones/tanqueos/presentation';
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

  async findAbastecimientoView(id: number): Promise<AbastecimientoRead | null> {
    return this.abastecimientoRepository.findViewById(id);
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

  async listEntradasRepositorio(repositorioId: number): Promise<AbastecimientoRead[]> {
    const repo = await this.repositorioRepository.findById(repositorioId);
    if (!repo) {
      throw new ResourceNotFoundError(`Repositorio con id: ${repositorioId} no encontrado`);
    }
    const entradas = await this.abastecimientoRepository.findViewsByRepositorioId(repositorioId);
    return entradas.map(e => ({
      ...e,
      anulable: e.estado !== EstadoAbastecimiento.ANULADO && e.repositorioId === repositorioId,
    }));
  }

  async anularAbastecimiento(id: number, motivoAnulacion: string): Promise<AbastecimientoRead> {
    const motivo = motivoAnulacion?.trim();
    if (!motivo || motivo.length < 10 || motivo.length > 500) {
      throw new BadInputError('motivoAnulacion debe tener entre 10 y 500 caracteres');
    }
    const abast = await this.abastecimientoRepository.findById(id);
    if (!abast) throw new ResourceNotFoundError(`Abastecimiento ${id} no encontrado`);
    const repositorioId = abast.getRepositorioId?.getValor;
    if (!repositorioId) {
      throw new BadInputError('Solo se anulan recargas al repositorio por esta ruta');
    }
    const usuario = getUser();
    const entrada = await this.repositorioRepository.findEntradaByAbastecimientoId(id);
    if (!entrada) {
      throw new BadInputError('No se encontró el movimiento de entrada del abastecimiento');
    }
    const cantidad = abast.getCantidadCombustible?.getValor ?? entrada.getCantidad;
    const repo = await this.repositorioRepository.findById(repositorioId);
    if (!repo) throw new ResourceNotFoundError('Repositorio no encontrado');

    abast.voidRecord(usuario.id, motivo);
    repo.registerSalidaCompensatoria(cantidad, usuario.id, id, entrada.getId.getValor);

    await this.txManager.transactional(async () => {
      await this.abastecimientoRepository.save(abast);
      await this.repositorioRepository.saveWithMovimientos(repo);
    });

    const view = await this.abastecimientoRepository.findViewById(id);
    if (!view) throw new ResourceNotFoundError('No fue posible recuperar el abastecimiento anulado');
    return view;
  }
}
