import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { EntityStatusQuery, FindThrowOptions } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import {
  AccesorioTipoEquipo,
  DocumentoTipoEquipo,
  PlanDefaultTipoEquipo,
  TipoEquipo,
} from '@equipos/domain/entities/catalogo';
import { TipoMedidaCodigo } from '@equipos/domain/enums';
import { TipoEquipoRead } from '@equipos/domain/read';
import { AccesorioTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/accesorio-tipo-equipo.repository';
import { DocumentoTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/documento-tipo-equipo.repository';
import { PlanDefaultTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/plan-default-tipo-equipo.repository';
import { TipoEquipoRepository } from '@equipos/domain/repositories/catalogo/tipo-equipo.repository';
import {
  ACCESORIO_TIPO_EQUIPO_REPOSITORY,
  DOCUMENTO_TIPO_EQUIPO_REPOSITORY,
  PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY,
  TIPO_EQUIPO_REPOSITORY,
} from '@equipos/domain/repositories/tokens';
import {
  ClasificacionBiomedica,
  DatosCalibracion,
  DatosTecnicos,
  FichaTecnicaTipoEquipo,
  Medida,
  PeriodoDeTiempo,
  VariableCalibracion,
} from '@equipos/domain/value-objects';
import { MedidasTecnicas } from '@equipos/domain/value-objects/medidas-tecnicas.vo';
import {
  CreateTipoEquipoDto,
  FilterTipoEquipoDto,
  FichaTecnicaTipoEquipoDto,
  UpdateFichaTecnicaTipoEquipoDto,
  UpdateTipoEquipoDto,
  ReplaceTipoEquipoDto,
} from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import {
  commitDocumentoTipoEquipoArchivo,
  validateDocumentoInput,
} from '../../helpers/documento-tipo-equipo.helper';
import { ClaseEquipoService } from './clase-equipo.service';
import { ChangeCampoTipoEquipo, ModifyTipoEquipoService } from './modify-tipo-equipo.service';
import { MarcaService } from '../marca/marca.service';
import { PartesCatgService } from './partes-catg.service';
import { TipoDocCategoriaActivoService } from './tipo-doc-categoria-activo.service';
import { UnidadMedidaService } from './unidad-medida.service';

@Injectable()
export class TipoEquipoService {
  constructor(
    @Inject(TIPO_EQUIPO_REPOSITORY)
    private readonly repository: TipoEquipoRepository,
    @Inject(ACCESORIO_TIPO_EQUIPO_REPOSITORY)
    private readonly accesorioRepository: AccesorioTipoEquipoRepository,
    @Inject(PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY)
    private readonly planRepository: PlanDefaultTipoEquipoRepository,
    @Inject(DOCUMENTO_TIPO_EQUIPO_REPOSITORY)
    private readonly documentoRepository: DocumentoTipoEquipoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly partesCatgService: PartesCatgService,
    private readonly marcaService: MarcaService,
    private readonly stagingFileService: StagingFileService,
    private readonly tipoDocCategoriaService: TipoDocCategoriaActivoService,
    private readonly claseEquipoService: ClaseEquipoService,
    private readonly modifyTipoEquipoService: ModifyTipoEquipoService
  ) {}

  async create({
    nombre,
    modeloId,
    subclaseId,
    observaciones,
    fichaTecnica,
    accesorios,
    planesDefault,
    documentos,
  }: CreateTipoEquipoDto): Promise<TipoEquipoRead> {
    const tipoActivoId = await this.claseEquipoService.resolveTipoActivoIdBySubclaseId(subclaseId);
    const fichaTec = await this.buildFichaTecnica(fichaTecnica);
    const tipoEquipo = TipoEquipo.create(
      nombre,
      modeloId,
      subclaseId,
      tipoActivoId,
      observaciones,
      fichaTec
    );

    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(tipoEquipo);
      const tipoEquipoId = saved.getId.getValor;

      await this.syncAccesorios(tipoEquipoId, accesorios ?? []);
      await this.syncPlanesDefault(tipoEquipoId, planesDefault ?? []);
      await this.syncDocumentos(tipoEquipoId, tipoActivoId, documentos ?? []);
      return this.repository.findViewById(tipoEquipoId);
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<TipoEquipo | null> {
    const tipoEquipoFound = await this.repository.findById(id);
    if (!tipoEquipoFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`TipoEquipo con id: ${id} no encontrado`);
    }
    return tipoEquipoFound;
  }

  async getOneById(id: number, filters?: EntityStatusQuery): Promise<TipoEquipoRead> {
    const view = await this.repository.findViewById(id, filters);
    if (!view) {
      throw new ResourceNotFoundError(`TipoEquipo con id: ${id} no encontrado`);
    }
    return view;
  }

  async findAllAndCount({
    page,
    limit,
    search,
    modeloId,
    subclaseId,
    estado,
    estadoHijos,
  }: FilterTipoEquipoDto): Promise<[TipoEquipoRead[], number]> {
    return this.repository.findAllAndCount(
      page,
      limit,
      { modeloId, subclaseId, estado, estadoHijos },
      search
    );
  }

  async update(id: number, data: UpdateTipoEquipoDto): Promise<TipoEquipoRead> {
    return this.txManager.transactional(async () => {
      const currentTipoEquipo = await this.findById(id, { throwIfNotFound: true });

      const changes: ChangeCampoTipoEquipo[] = [];
      if (data.nombre !== undefined && data.nombre !== currentTipoEquipo.getNombre) {
        changes.push({
          campo: 'nombre',
          valorAnterior: currentTipoEquipo.getNombre,
          valorNuevo: data.nombre,
        });
      }
      if (
        data.observaciones !== undefined &&
        (data.observaciones ?? null) !== (currentTipoEquipo.getObservaciones ?? null)
      ) {
        changes.push({
          campo: 'observaciones',
          valorAnterior: currentTipoEquipo.getObservaciones ?? null,
          valorNuevo: data.observaciones ?? null,
        });
      }

      currentTipoEquipo.modifyBasic({
        nombre: data.nombre,
        observaciones: data.observaciones,
      });

      if (changes.length) {
        const usuario = getUser();
        await this.modifyTipoEquipoService.execute({
          tipoEquipoId: id,
          cambios: changes,
          sincronizar: data.sincronizar ?? false,
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombre,
          observaciones: data.observaciones,
        });
        await this.repository.update(currentTipoEquipo);
      }

      return this.repository.findViewById(id);
    });
  }

  async updateFichaTecnica(
    id: number,
    data: UpdateFichaTecnicaTipoEquipoDto
  ): Promise<TipoEquipoRead> {
    return this.txManager.transactional(async () => {
      const tipoEquipo = await this.findById(id, { throwIfNotFound: true });
      const fichaTecnica = await this.buildFichaTecnicaFromFullState(data);
      tipoEquipo.replaceFichaTecnica(fichaTecnica);
      await this.repository.update(tipoEquipo);

      const usuario = getUser();
      await this.modifyTipoEquipoService.execute({
        tipoEquipoId: id,
        cambios: [{ campo: 'fichaTecnica', valorAnterior: null, valorNuevo: 'actualizada' }],
        sincronizar: data.sincronizar ?? false,
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
      });

      return this.repository.findViewById(id);
    });
  }

  async desactivate(id: number): Promise<void> {
    await this.txManager.transactional(async () => {
      const tipo = await this.findById(id, { throwIfNotFound: true });
      tipo.desactivar();
      await this.repository.update(tipo);
    });
  }

  private async syncAccesorios(
    tipoEquipoId: number,
    accesorios: ReplaceTipoEquipoDto['accesorios']
  ): Promise<void> {
    const existing = await this.accesorioRepository.findByTipoEquipoId(tipoEquipoId);
    for (const old of existing) {
      await this.accesorioRepository.delete(old.id);
    }

    for (const acc of accesorios) {
      const { parteId, parteSnap } = await this.partesCatgService.resolveForAccesorio({
        parteId: acc.parteId,
        parte: acc.parte,
      });
      if (acc.marcaId) {
        await this.marcaService.findById(acc.marcaId);
      }
      const entity = AccesorioTipoEquipo.create(
        tipoEquipoId,
        parteId,
        parteSnap,
        acc.cantidad,
        acc.marcaId,
        acc.referencia,
        acc.observaciones
      );
      await this.accesorioRepository.save(entity);
    }
  }

  private async syncPlanesDefault(
    tipoEquipoId: number,
    planesDefault: ReplaceTipoEquipoDto['planesDefault']
  ): Promise<void> {
    const existentes = await this.planRepository.findAll({ tipoEquipoId });
    for (const old of existentes) {
      await this.planRepository.delete(old.id);
    }

    for (const plDf of planesDefault) {
      const entity = PlanDefaultTipoEquipo.create(
        tipoEquipoId,
        plDf.tipo,
        plDf.periocidad?.valor,
        plDf.periocidad?.unidad,
        plDf.diasAntNotif,
        plDf.realizaExterno,
        plDf.formatoId,
        plDf.observaciones
      );
      await this.planRepository.save(entity);
    }
  }

  private async syncDocumentos(
    tipoEquipoId: number,
    tipoActivoId: number,
    documentos: ReplaceTipoEquipoDto['documentos']
  ): Promise<void> {
    const existentes = await this.documentoRepository.findByTipoEquipoId(tipoEquipoId);
    for (const old of existentes) {
      await this.documentoRepository.delete(old.id);
    }

    for (const d of documentos) {
      const tipoDoc = await this.tipoDocCategoriaService.findById(d.tipoDocumentoId, {
        throwIfNotFound: true,
      });
      if (!tipoDoc.AppliesToTipoActivo(tipoActivoId)) {
        throw new BadInputError(
          `El tipo de documento "${tipoDoc.getNombre}" no aplica para el tipo de activo del equipo`
        );
      }
      await validateDocumentoInput(
        this.stagingFileService,
        tipoDoc.getCategoria,
        d.aplica,
        tipoDoc.IsObligatorioPara(tipoActivoId),
        d.archivoId
      );
      const entity = DocumentoTipoEquipo.createForTipoEquipo(
        tipoEquipoId,
        d.tipoDocumentoId,
        d.aplica,
        d.archivoId,
        d.observaciones
      );
      const savedDoc = await this.documentoRepository.save(entity);
      if (d.aplica && d.archivoId) {
        await commitDocumentoTipoEquipoArchivo(
          this.stagingFileService,
          tipoDoc.getCategoria,
          d.archivoId,
          savedDoc.getId.getValor
        );
      }
    }
  }

  private async buildDatosTecnicos(
    datosTecnicos: FichaTecnicaTipoEquipoDto['datosTecnicos']
  ): Promise<DatosTecnicos | undefined> {
    if (!datosTecnicos?.medidas?.length) return undefined;
    const medidas: Medida[] = [];
    const tiposUsados = new Set<TipoMedidaCodigo>();

    for (const me of datosTecnicos.medidas) {
      if (me.tipo !== TipoMedidaCodigo.OTROS) {
        if (tiposUsados.has(me.tipo)) {
          throw new BadInputError(
            `Tipo de medida duplicado: ${me.tipo}. Solo OTROS puede repetirse`
          );
        }
        tiposUsados.add(me.tipo);
      }

      const unidad = await this.unidadMedidaService.findOneById(me.unidadId);
      if (me.valorMin != null && me.valorMax != null) {
        medidas.push(
          Medida.createRango(
            me.tipo,
            me.valorMin,
            me.valorMax,
            me.unidadId,
            unidad.getNombre,
            me.nombre
          )
        );
      } else {
        medidas.push(Medida.create(me.tipo, me.valor, me.unidadId, unidad.getNombre, me.nombre));
      }
    }

    return DatosTecnicos.create(MedidasTecnicas.create(medidas));
  }

  private async buildFichaTecnica(
    data?: FichaTecnicaTipoEquipoDto
  ): Promise<FichaTecnicaTipoEquipo | undefined> {
    if (!data) return undefined;
    const hasFichaInput =
      data.vidaUtil !== undefined ||
      data.reqCalibracion !== undefined ||
      data.datosCalibracion !== undefined ||
      data.datosTecnicos !== undefined ||
      data.dtCalibNormaAplicable !== undefined ||
      data.clasificacion !== undefined;

    if (!hasFichaInput) return undefined;
    return this.buildFichaTecnicaFromFullState(data);
  }

  private async buildFichaTecnicaFromFullState(
    data: FichaTecnicaTipoEquipoDto
  ): Promise<FichaTecnicaTipoEquipo> {
    const vidaUtilFinal = data.vidaUtil
      ? PeriodoDeTiempo.create(data.vidaUtil.valor, data.vidaUtil.unidad)
      : undefined;

    const dtCalib = data.datosCalibracion?.variables?.length
      ? DatosCalibracion.create(
          VariableCalibracion.create(data.datosCalibracion.variables),
          data.datosCalibracion.codigoUltimaCalibracion
        )
      : undefined;

    const dtTec = data.datosTecnicos?.medidas?.length
      ? await this.buildDatosTecnicos(data.datosTecnicos)
      : DatosTecnicos.create();

    const clasifBio = data.clasificacion
      ? ClasificacionBiomedica.create(
          data.clasificacion.aplicaRegSanitario,
          data.clasificacion.diagnostico,
          data.clasificacion.prevencion,
          data.clasificacion.rehabilitacion,
          data.clasificacion.analisisLaboratorio,
          data.clasificacion.tratamientoMantenimientoDeVida,
          data.clasificacion.riesgo,
          data.clasificacion.numeroRegSanitario,
          data.clasificacion.expedienteRegSanitario
        )
      : ClasificacionBiomedica.create();

    return FichaTecnicaTipoEquipo.create(
      dtTec,
      clasifBio,
      vidaUtilFinal,
      data.reqCalibracion ?? false,
      dtCalib,
      data.dtCalibNormaAplicable
    );
  }
}
