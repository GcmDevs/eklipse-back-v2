import { FILE_LOCATIONS } from '@common/application/constants';
import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { PayloadArchivo, RESTRICCIONES_MIME_STAGING, TipoContextoArchivo } from '@core/media/domain/types';
import { ProveedorService, ResponsableService } from '@core/terceros/application/services';
import { Equipo, Marca, Modelo, PlanActividad } from '@equipos/domain/entities';
import { EstadoBusquedaEquipo, TipoActividad } from '@equipos/domain/enums';
import { DomainEquipoEvent } from '@equipos/domain/events';
import { EquipoRead } from '@equipos/domain/read';
import {
  EQUIPOS_REPOSITORY,
  EquiposRepository,
} from '@equipos/domain/repositories';
import { IAccesorioUnidadRepository } from '@equipos/domain/repositories/accesorio-unidad.repository';
import { PlanDefaultTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/plan-default-tipo-equipo.repository';
import { ACCESORIO_UNIDAD_REPOSITORY, PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { RegistroFotografico } from '@equipos/domain/value-objects';
import { GeneralActivoLegacyMapper } from '@equipos/infrastructure';
import { GeneralActivoLegacyView } from '@equipos/infrastructure/persistence/views/external';
import { ImportEquipoLegacyDto } from '@equipos/presentation/dto';
import { ResponseGeneralActivoLegacyEnrichedDto } from '@equipos/presentation/dto/equipo-legacy.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  buildCamposRequeridosUsuario,
  buildLegacyImportSuggestions,
  buildPlanActividad,
  generateCorrelationId,
  mapMarcaToResponse,
  mapModeloToResponse,
  mergeLegacyImportPayload,
  normalizeLocalizacion,
  resolvePlanCreacionEquipo,
} from '../helpers';
import { ActividadesService, FormatoService } from './actividades';
import { CompraService } from './adquisicion';
import { AccesorioTipoEquipoService, TipoActivoService, TipoEquipoService } from './catalogo';
import { MarcaService, ModeloService } from './marca';


@Injectable()
export class EquiposLegacyService {
  constructor(
    @Inject(EQUIPOS_REPOSITORY)
    private readonly equipoRepository: EquiposRepository,
    private readonly responsableService: ResponsableService,
    private readonly proveedorService: ProveedorService,
    private readonly modeloService: ModeloService,
    private readonly marcaService: MarcaService,
    private readonly formatoService: FormatoService,
    private readonly actividadService: ActividadesService,
    private readonly compraService: CompraService,
    private readonly tipoActivoService: TipoActivoService,
    private readonly tipoEquipoService: TipoEquipoService,
    private readonly accesorioTipoEquipoService: AccesorioTipoEquipoService,
    private readonly stagingFileService: StagingFileService,
    @Inject(PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY)
    private readonly planDefaultRepository: PlanDefaultTipoEquipoRepository,
    @Inject(ACCESORIO_UNIDAD_REPOSITORY)
    private readonly accesorioUnidadRepository: IAccesorioUnidadRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
  ) { }

  public async importEquipoLegacy({
    complemento,
    numeroPlaca,
  }: ImportEquipoLegacyDto): Promise<EquipoRead> {
    const legacy = await this.equipoRepository.findGeneralActivoByNumeroPlaca(numeroPlaca);
    if (!legacy) {
      throw new ResourceNotFoundError(
        `Equipo legacy con placa ${numeroPlaca} no encontrado`,
      );
    }

    const alreadyImported = await this.equipoRepository.alreadyExist(numeroPlaca);
    if (alreadyImported) {
      throw new BadRequestException(
        `El equipo legacy con placa ${numeroPlaca} ya fue importado`,
      );
    }

    const modeloEquivalent = await this.resolveModeloEquivalent(
      legacy.modeloLegacyNombre,
      legacy.marcaLegacyNombre,
    );
    const sugerencias = buildLegacyImportSuggestions(legacy, modeloEquivalent);
    const merged = mergeLegacyImportPayload(numeroPlaca, sugerencias, complemento);

    const [tipoEquipo, responsable] = await Promise.all([
      this.tipoEquipoService.findById(merged.tipoEquipoId),
      this.responsableService.findById(merged.responsableId),
    ]);

    if (!tipoEquipo) {
      throw new ResourceNotFoundError(`Tipo de equipo con id: ${merged.tipoEquipoId} no encontrado`);
    }
    if (!responsable) {
      throw new ResourceNotFoundError(`Responsable con id: ${merged.responsableId} no encontrado`);
    }

    const tipoActivo = await this.tipoActivoService.findById(tipoEquipo.getTipoActivoId.getValor);
    if (!tipoActivo) {
      throw new ResourceNotFoundError(`Tipo de activo con id: ${tipoEquipo.getTipoActivoId.getValor} no encontrado`);
    }

    const compra = await this.compraService.findById(merged.compraId);
    if (!compra) {
      throw new ResourceNotFoundError(`Registro de entrada con id: ${merged.compraId} no encontrado`);
    }

    const tipoEquipoCatId = tipoEquipo.getId.getValor;
    const planesDefaultList = await this.planDefaultRepository.findAll({ tipoEquipoId: tipoEquipoCatId });

    const planMantenimientoResuelto = resolvePlanCreacionEquipo(
      merged.planMantenimiento,
      TipoActividad.MANTENIMIENTO,
      planesDefaultList,
    );
    const planCalibracionResuelto = resolvePlanCreacionEquipo(
      merged.planCalibracion,
      TipoActividad.CALIBRACION,
      planesDefaultList,
    );

    const planes: PlanActividad[] = [];
    if (planMantenimientoResuelto.planPersonalizado) {
      planes.push(await buildPlanActividad(
        this.formatoService,
        TipoActividad.MANTENIMIENTO,
        planMantenimientoResuelto.planPersonalizado,
      ));
    }
    if (planCalibracionResuelto.planPersonalizado) {
      planes.push(await buildPlanActividad(
        this.formatoService,
        TipoActividad.CALIBRACION,
        planCalibracionResuelto.planPersonalizado,
      ));
    }

    const registroFotografico = merged.registroFotografico?.length
      ? RegistroFotografico.create(merged.registroFotografico)
      : undefined;

    const equipo = Equipo.create(
      merged.nombre,
      merged.codigo,
      merged.numeroSerie,
      merged.numeroPlaca,
      tipoEquipoCatId,
      merged.numeroInventario,
      planes,
      responsable.responsableId,
      merged.estado,
      normalizeLocalizacion(merged.localizacion),
      merged.fechaPuestaFuncionamiento,
      merged.observaciones,
      true,
      merged.compraId,
      registroFotografico,
      planMantenimientoResuelto.planDefaultId,
      planCalibracionResuelto.planDefaultId,
    );

    const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [];
    const correlationId = generateCorrelationId();

    return this.txManager.transactional(async () => {
      const equipoImportedSaved = await this.equipoRepository.save(equipo);
      equipoImportedSaved.registerImportedEvent({
        generalActivoId: legacy.id,
        activoId: legacy.activoId,
      });

      const accesoriosEstandar = await this.accesorioTipoEquipoService.findByTipoEquipoId(tipoEquipoCatId);
      if (accesoriosEstandar.length > 0) {
        await Promise.all(
          accesoriosEstandar.map(a =>
            this.accesorioUnidadRepository.createFromEstandar(
              equipoImportedSaved.getId.getValor,
              a.id,
              a.parteSnap,
            ),
          ),
        );
      }

      const planesConFecha = equipoImportedSaved.getPlanesActividad
        .filter(plan => !!plan.getFechaProximaEjecucion);

      const actividades = await Promise.all(
        planesConFecha.map(plan =>
          this.actividadService.createRegistroProgramadoDefault({
            equipoId: equipoImportedSaved.getId.getValor,
            esRealizaPorExterno: plan.getSeRealizaPorExterno ?? false,
            tipo: plan.getTipo,
            formatoId: plan.getFormatoId?.getValor ?? null,
            planActividadId: plan.getId.getValor,
            fechaPrograma: plan.getFechaProximaEjecucion,
          }),
        ),
      );

      const payloads: PayloadArchivo[] = [];
      for (const foto of merged.registroFotografico ?? []) {
        if (!foto.archivoId) continue;
        payloads.push({
          archivoId: foto.archivoId,
          contexto: TipoContextoArchivo.REGISTRO_FOTOGRAFICO_EQUIPO,
          module: FILE_LOCATIONS.inn.eqp.hdv.regFotg,
          referenciaId: equipoImportedSaved.getId.getValor,
        });
      }
      if (payloads.length > 0) {
        await this.stagingFileService.commitMany(
          payloads,
          RESTRICCIONES_MIME_STAGING.IMAGENES,
        );
      }

      aggregates.push(equipoImportedSaved, ...actividades);
      return this.equipoRepository.findViewById(equipoImportedSaved.getId.getValor);
    }, aggregates, correlationId);
  }

  public async getGeneralActivoByNumeroPlaca(
    numeroPlaca: string,
  ): Promise<ResponseGeneralActivoLegacyEnrichedDto> {
    const { equipo, estado } = await this.equipoRepository.findInGlobalSystemByPlaca(numeroPlaca);
    if (equipo && estado === EstadoBusquedaEquipo.IMPORTABLE) {
      const { marca, modelo } = await this.resolveCatalogoEquivalents(equipo);
      const [proveedorExiste, responsableExiste] = await Promise.all([
        equipo.proveedorId
          ? this.proveedorService.findById(equipo.proveedorId, { throwIfNotFound: false })
            .then(p => !!p)
          : Promise.resolve(false),
        equipo.responsableId
          ? this.responsableService.findById(equipo.responsableId, { throwIfNotFound: false })
            .then(r => !!r)
          : Promise.resolve(false),
      ]);

      const marcaResponse = mapMarcaToResponse(marca);
      const modeloResponse = mapModeloToResponse(modelo, marca);
      const legacyResponse = GeneralActivoLegacyMapper.toResponse(equipo, marcaResponse, modeloResponse);
      if (!legacyResponse) {
        throw new ResourceNotFoundError(`Activo legacy con placa ${numeroPlaca} no encontrado`);
      }
      return {
        legacy: legacyResponse,
        catalogo: {
          marca: marcaResponse,
          modelo: modeloResponse,
          proveedorExiste,
          responsableExiste,
        },
        valoresSugeridos: buildLegacyImportSuggestions(equipo, modelo),
        camposRequeridosUsuario: buildCamposRequeridosUsuario(),
        estado,
      };
    }
    return { estado, legacy: null, catalogo: null, valoresSugeridos: null, camposRequeridosUsuario: null }
  }

  public async findGeneralActivoByNumeroPlaca(
    numPlaca: string,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<GeneralActivoLegacyView | null> {
    const gralActivoFound = await this.equipoRepository.findGeneralActivoByNumeroPlaca(numPlaca);
    if (!gralActivoFound) {
      if (options.throwIfNotFound) {
        throw new ResourceNotFoundError(
          `No se encontro el activo general con el numero de placa: ${numPlaca}`,
        );
      }
      return null;
    }
    return gralActivoFound;
  }

  private async resolveCatalogoEquivalents(
    legacy: GeneralActivoLegacyView,
  ): Promise<{ marca: Marca | null; modelo: Modelo | null }> {
    const modelo = await this.resolveModeloEquivalent(
      legacy.modeloLegacyNombre,
      legacy.marcaLegacyNombre,
    );

    let marca: Marca | null = null;
    if (legacy.marcaLegacyNombre) {
      marca = await this.marcaService.findMarcaByLegacyNombre(
        legacy.marcaLegacyNombre,
        { throwIfNotFound: false },
      );
    } else if (modelo) {
      marca = await this.marcaService.findById(modelo.getMarcaId.getValor, {
        throwIfNotFound: false,
      });
    }

    return { marca, modelo };
  }

  private async resolveModeloEquivalent(
    modeloLegacyNombre?: string | null,
    marcaLegacyNombre?: string | null,
  ): Promise<Modelo | null> {
    if (!modeloLegacyNombre) {
      return null;
    }

    const modeloEquivalent = await this.modeloService.findModeloByLegacyNombre(
      modeloLegacyNombre,
      { throwIfNotFound: false },
    );

    if (!modeloEquivalent || !marcaLegacyNombre) {
      return modeloEquivalent;
    }

    const marcaEquivalent = await this.marcaService.findMarcaByLegacyNombre(
      marcaLegacyNombre,
      { throwIfNotFound: false },
    );

    if (
      marcaEquivalent &&
      modeloEquivalent.getMarcaId.getValor !== marcaEquivalent.getId.getValor
    ) {
      return null;
    }

    return modeloEquivalent;
  }
}
