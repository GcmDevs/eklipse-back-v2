import { FILE_LOCATIONS } from '@common/application/file-locations';
import {
  hasDefinedValues,
  TRANSACTION_MANAGER,
  TransactionManager,
} from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import {
  PayloadArchivo,
  RESTRICCIONES_MIME_STAGING,
  TipoContextoArchivo,
} from '@core/media/domain/types';
import { ResponsableService } from '@core/terceros/application/services';
import { Equipo, EquipoBaja, PlanActividad } from '@equipos/domain/entities';
import {
  EstadoEquipo,
  MotivoAnulacionActividad,
  MotivoCambioEstadoEquipo,
  TipoActividad,
  TipoMantenimiento,
} from '@equipos/domain/enums';
import { DomainEquipoEvent } from '@equipos/domain/events';
import { EquipoRead, ResumenEquiposRead } from '@equipos/domain/read';
import { EQUIPOS_REPOSITORY, EquiposRepository } from '@equipos/domain/repositories';
import { IAccesorioUnidadRepository } from '@equipos/domain/repositories/accesorio-unidad.repository';
import { PlanDefaultTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/plan-default-tipo-equipo.repository';
import {
  ACCESORIO_UNIDAD_REPOSITORY,
  PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY,
} from '@equipos/domain/repositories/tokens';
import { RegistroFotografico } from '@equipos/domain/value-objects';
import {
  CreateEquipoDto,
  DarDeBajaEquipoDto,
  FilterEquipoDto,
  FilterResumenEquipoDto,
  UpdateEquipoDto,
  UpdatePlanActividadDto,
} from '@equipos/presentation/dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  buildPeriocidad,
  buildPlanActividad,
  generateCorrelationId,
  normalizeLocalizacion,
  resolvePlanCreacionEquipo,
} from '../helpers';
import { ActividadesService, FormatoService } from './actividades';
import { CompraService } from './adquisicion';
import { AccesorioTipoEquipoService, TipoActivoService, TipoEquipoService } from './catalogo';

@Injectable()
export class EquiposService {
  constructor(
    @Inject(EQUIPOS_REPOSITORY)
    private readonly equipoRepository: EquiposRepository,
    private readonly responsableService: ResponsableService,
    private readonly stagingFileService: StagingFileService,
    private readonly formatoService: FormatoService,
    private readonly stagingService: StagingFileService,
    private readonly actividadService: ActividadesService,
    private readonly compraService: CompraService,
    private readonly tipoActivoService: TipoActivoService,
    private readonly tipoEquipoRelService: TipoEquipoService,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly accesorioTipoEquipoService: AccesorioTipoEquipoService,
    @Inject(PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY)
    private readonly planDefaultRepository: PlanDefaultTipoEquipoRepository,
    @Inject(ACCESORIO_UNIDAD_REPOSITORY)
    private readonly accesorioUnidadRepository: IAccesorioUnidadRepository
  ) {}

  public async create({
    compraId,
    planMantenimiento: planMantenimientoData,
    planCalibracion: planCalibracionData,
    registroFotografico: registroFotograficoData = [],
    responsableId,
    numeroInventario = null,
    ...equipoData
  }: CreateEquipoDto): Promise<EquipoRead> {
    if (equipoData.estado === EstadoEquipo.DE_BAJA) {
      throw new BadInputError('No se puede crear un equipo en estado DE BAJA');
    }
    const isAlreadyInLegacy = await this.equipoRepository.alreadyExistActivoLegacy(
      equipoData.numeroPlaca
    );
    if (isAlreadyInLegacy)
      throw new BadInputError(
        'el equipo que esta intentando crear esta en los equipo antiguos, por favor importelo'
      );

    const [tipoEquipoRel, compraAssociated, responsableAssociated] = await Promise.all([
      this.tipoEquipoRelService.findById(equipoData.tipoEquipoId),
      this.compraService.findById(compraId),
      this.responsableService.findById(responsableId),
    ]);

    if (!tipoEquipoRel)
      throw new ResourceNotFoundError(
        `Tipo de equipo con id: ${equipoData.tipoEquipoId} no encontrado`
      );
    if (!compraAssociated)
      throw new ResourceNotFoundError(`Registro de entrada con id: ${compraId} no encontrado`);
    if (!responsableAssociated)
      throw new ResourceNotFoundError(`Responsable con id: ${responsableId} no encontrado`);

    const tipoActivo = await this.tipoActivoService.findById(
      tipoEquipoRel.getTipoActivoId.getValor
    );
    if (!tipoActivo)
      throw new ResourceNotFoundError(
        `Tipo de activo con id: ${tipoEquipoRel.getTipoActivoId.getValor} no encontrado`
      );
    const tipoEquipoCatId = tipoEquipoRel.getId.getValor;

    let accesoriosEstandarList: Array<{ id: number; parteSnap: string }> = [];

    const [accesorios, planesDefaultList] = await Promise.all([
      this.accesorioTipoEquipoService.findByTipoEquipoId(tipoEquipoCatId),
      this.planDefaultRepository.findAll({ tipoEquipoId: tipoEquipoCatId }),
    ]);
    accesoriosEstandarList = accesorios;

    const planMantenimientoResuelto = resolvePlanCreacionEquipo(
      planMantenimientoData,
      TipoActividad.MANTENIMIENTO,
      planesDefaultList
    );
    const planCalibracionResuelto = resolvePlanCreacionEquipo(
      planCalibracionData,
      TipoActividad.CALIBRACION,
      planesDefaultList
    );

    const planes: PlanActividad[] = [];
    if (planMantenimientoResuelto.planPersonalizado) {
      planes.push(
        await buildPlanActividad(
          this.formatoService,
          TipoActividad.MANTENIMIENTO,
          planMantenimientoResuelto.planPersonalizado
        )
      );
    }

    if (planCalibracionResuelto.planPersonalizado) {
      planes.push(
        await buildPlanActividad(
          this.formatoService,
          TipoActividad.CALIBRACION,
          planCalibracionResuelto.planPersonalizado
        )
      );
    }

    const registroFotografico = registroFotograficoData.length
      ? RegistroFotografico.create(registroFotograficoData)
      : undefined;

    const equipo = Equipo.create(
      equipoData.nombre,
      equipoData.codigo,
      equipoData.numeroSerie,
      equipoData.numeroPlaca,
      tipoEquipoCatId,
      numeroInventario,
      planes,
      responsableAssociated.responsableId,
      equipoData.estado,
      normalizeLocalizacion(equipoData.localizacion),
      equipoData?.fechaPuestaFuncionamiento,
      equipoData.observaciones,
      undefined,
      compraId,
      registroFotografico,
      planMantenimientoResuelto.planDefaultId,
      planCalibracionResuelto.planDefaultId
    );
    const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [];
    const correlationId = generateCorrelationId();

    return this.txManager.transactional(
      async () => {
        const equipoSaved = await this.equipoRepository.save(equipo);
        equipoSaved.registerCreatedEvent();

        if (accesoriosEstandarList.length > 0) {
          await Promise.all(
            accesoriosEstandarList.map(a =>
              this.accesorioUnidadRepository.createFromEstandar(
                equipoSaved.getId.getValor,
                a.id,
                a.parteSnap
              )
            )
          );
        }

        const planesConFecha = equipoSaved.getPlanesActividad.filter(
          plan => !!plan.getFechaProximaEjecucion
        );

        const actividades = await Promise.all(
          planesConFecha.map(plan =>
            this.actividadService.createRegistroProgramadoDefault({
              equipoId: equipoSaved.getId.getValor,
              esRealizaPorExterno: plan.getSeRealizaPorExterno ?? false,
              tipo: plan.getTipo,
              formatoId: plan.getFormatoId?.getValor ?? null,
              planActividadId: plan.getId.getValor,
              fechaPrograma: plan.getFechaProximaEjecucion,
            })
          )
        );

        const payloads: PayloadArchivo[] = [];
        for (const foto of registroFotograficoData ?? []) {
          if (!foto.archivoId) continue;
          payloads.push({
            archivoId: foto.archivoId,
            contexto: TipoContextoArchivo.REGISTRO_FOTOGRAFICO_EQUIPO,
            module: FILE_LOCATIONS.inn.eqp.hdv.regFotg,
            referenciaId: equipoSaved.getId.getValor,
          });
        }

        await this.stagingService.commitMany(payloads, RESTRICCIONES_MIME_STAGING.IMAGENES);
        aggregates.push(equipoSaved, ...actividades);
        return this.equipoRepository.findViewById(equipoSaved.getId.getValor);
      },
      aggregates,
      correlationId
    );
  }

  public async getOneById(id: number): Promise<EquipoRead> {
    const equipoFound = await this.equipoRepository.findViewById(id);
    if (!equipoFound) {
      throw new ResourceNotFoundError(`Equipo con id: ${id} no encontrado`);
    }
    return equipoFound;
  }

  public async getOneByPlaca(numeroPlaca: string): Promise<EquipoRead> {
    const equipoFound = await this.equipoRepository.findViewByPlaca(numeroPlaca);
    if (!equipoFound) {
      throw new ResourceNotFoundError(`Equipo con placa: ${numeroPlaca} no encontrado`);
    }
    return equipoFound;
  }

  public async getAll({
    page,
    limit,
    tipoActivoId,
    estado,
    areaId,
    responsablesIds,
  }: FilterEquipoDto): Promise<[EquipoRead[], number]> {
    const [equipos, count] = await this.equipoRepository.findAllAndCount(page, limit, {
      estado,
      tipoActivoId: tipoActivoId,
      areaId,
      responsablesIds,
    });
    return [equipos, count];
  }

  public async getResumen({
    tipoActivoId,
    estado,
    areaId,
    responsablesIds,
  }: FilterResumenEquipoDto): Promise<ResumenEquiposRead> {
    return this.equipoRepository.getResumen({ tipoActivoId, estado, areaId, responsablesIds });
  }

  public async update(
    id: number,
    { tipoEquipoId, compraId, ...updateEquipoData }: UpdateEquipoDto
  ): Promise<EquipoRead> {
    if (!hasDefinedValues({ tipoEquipoId, compraId, ...updateEquipoData })) {
      throw new BadInputError('El objeto no puede estar vacio');
    }

    if (tipoEquipoId !== undefined) {
      const tipoEquipoCat = await this.tipoEquipoRelService.findById(tipoEquipoId);
      if (!tipoEquipoCat)
        throw new NotFoundException(
          `no se pudo actualizar el equipo, no se encontro el tipo de equipo con id ${tipoEquipoId}`
        );
    }

    if (compraId !== undefined) {
      const compraAssociated = await this.compraService.findById(compraId);
      if (!compraAssociated) {
        throw new ResourceNotFoundError(`Registro de entrada con id: ${compraId} no encontrado`);
      }
    }

    const equipoFound = await this.findById(id);
    if (!equipoFound) {
      throw new ResourceNotFoundError(`Equipo con id: ${id} no encontrado`);
    }
    const tipoEquipoCatId =
      tipoEquipoId === equipoFound.getTipoEquipoCatId.getValor ? undefined : tipoEquipoId;

    equipoFound.update({ tipoEquipoCatId, compraId, ...updateEquipoData });

    return await this.txManager.transactional(async () => {
      const equipoUpdate = await this.equipoRepository.update(equipoFound);
      if (!equipoUpdate)
        throw new NotFoundException(`No se pudo actualizar el equipo con id: ${id}`);
      return await this.equipoRepository.findViewById(equipoUpdate.getId.getValor);
    }, [equipoFound]);
  }

  public async updatePlan(
    equipoId: number,
    tipo: TipoActividad,
    { periocidad, ...updateData }: UpdatePlanActividadDto
  ): Promise<EquipoRead> {
    if (!hasDefinedValues({ periocidad, ...updateData }))
      throw new BadInputError('El objeto no puede estar vacío');

    if (updateData.formatoId) {
      await this.formatoService.findByIdAndTipo(updateData.formatoId, TipoMantenimiento.PREVENTIVO);
    }

    const equipoFound = await this.findById(equipoId);
    const planAntes = equipoFound.getPlan(tipo);
    const fechaAntes = planAntes?.getFechaProximaEjecucion;
    const estabaCompletoAntes = !!fechaAntes;
    equipoFound.updatePlan(tipo, {
      periocidad: buildPeriocidad(periocidad),
      ...updateData,
    });

    const planDespues = equipoFound.getPlan(tipo);
    const fechaDespues = planDespues?.getFechaProximaEjecucion;
    const estaCompletoDespues = !!fechaDespues;

    let accion: 'CREATE' | 'UPDATE' | 'NOTHING' = 'NOTHING';
    if (!estabaCompletoAntes && estaCompletoDespues) {
      accion = 'CREATE';
    } else if (
      estabaCompletoAntes &&
      estaCompletoDespues &&
      fechaAntes?.getTime() !== fechaDespues?.getTime()
    ) {
      accion = 'UPDATE';
    }

    const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [];
    const correlationId = generateCorrelationId();
    return await this.txManager.transactional(
      async () => {
        const equipoUpdated = await this.equipoRepository.updatePlan(equipoFound, tipo);

        if (!equipoUpdated) throw new NotFoundException(`No se pudo actualizar el plan`);
        const planFinal = equipoUpdated.getPlan(tipo);

        if (accion === 'CREATE') {
          const actividad = await this.actividadService.createRegistroProgramadoDefault({
            equipoId: equipoUpdated.getId.getValor,
            esRealizaPorExterno: updateData?.seRealizaPorExterno ?? false,
            tipo: planFinal.getTipo,
            formatoId: planFinal.getFormatoId?.getValor ?? null,
            planActividadId: planFinal.getId.getValor,
            fechaPrograma: planFinal.getFechaProximaEjecucion,
          });
          aggregates.push(actividad);
        }

        if (accion === 'UPDATE') {
          await this.actividadService.updateRegistroProgramado(
            planFinal.getId.getValor,
            planFinal.getFechaProximaEjecucion
          );
        }

        aggregates.push(equipoFound);
        return this.equipoRepository.findViewById(equipoUpdated.getId.getValor);
      },
      aggregates,
      correlationId
    );
  }

  public async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<Equipo | null> {
    const equipoFound = await this.equipoRepository.findById(id);
    if (!equipoFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Equipo con id: ${id} no encontrado`);
    }

    return equipoFound;
  }

  public async changeEstado(
    id: number,
    data: {
      nuevoEstado: EstadoEquipo;
      motivo: MotivoCambioEstadoEquipo;
      observaciones?: string;
      correlationId?: string;
    }
  ): Promise<void> {
    const equipo = await this.findById(id);
    if (!equipo)
      throw new ResourceNotFoundError(
        `Equipo no encontrado, revise si existe el equipo o esta en el sistema`
      );
    equipo.changeEstado(data.nuevoEstado, data.motivo, data?.observaciones);

    if (data.nuevoEstado == EstadoEquipo.EN_BODEGA) {
      await this.actividadService.cancelPendientesByEquipo(
        id,
        MotivoAnulacionActividad.BAJA_INDEFINIDA
      );
    }
    await this.txManager.transactional(
      async () => {
        await this.equipoRepository.changeEstado(equipo);
      },
      [equipo],
      data.correlationId
    );
  }

  public async darBaja(
    id: number,
    data: DarDeBajaEquipoDto,
    correlationId?: string
  ): Promise<EquipoRead> {
    const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [];
    await this.txManager.transactional(
      async () => {
        const equipo = await this.findById(id);
        if (!equipo) {
          throw new ResourceNotFoundError(
            'Equipo no encontrado, no se pudo completar el proceso de baja'
          );
        }

        await this.stagingFileService.commit(
          {
            archivoId: data.archivoActaId,
            module: FILE_LOCATIONS.inn.eqp.actas.de_baja,
            contexto: TipoContextoArchivo.ACTA_EQUIPO,
            referenciaId: id,
          },
          RESTRICCIONES_MIME_STAGING.DOCUMENTOS,
          true
        );

        equipo.darBaja();
        const usuarioResponsableBajaId = getUser().id;
        const baja = EquipoBaja.create({
          equipoId: id,
          archivoActaId: data.archivoActaId,
          motivo: data.motivo,
          usuarioId: usuarioResponsableBajaId,
          observaciones: data.observaciones,
        });

        await this.equipoRepository.saveBaja(equipo, baja);
        await this.actividadService.cancelPendientesByEquipo(
          id,
          MotivoAnulacionActividad.BAJA_DEFINITIVA
        );
        aggregates.push(equipo);
      },
      aggregates,
      correlationId
    );
    return this.equipoRepository.findViewById(id);
  }
}
