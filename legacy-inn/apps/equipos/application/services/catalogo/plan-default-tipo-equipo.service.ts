import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { PlanDefaultTipoEquipo } from '@equipos/domain/entities/catalogo/plan-default-tipo-equipo.entity';
import { PlanDefaultTipoEquipoRead } from '@equipos/domain/read';
import { PlanDefaultTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/plan-default-tipo-equipo.repository';
import { TipoEquipoRepository } from '@equipos/domain/repositories/catalogo/tipo-equipo.repository';
import { PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY, TIPO_EQUIPO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import {
  CreatePlanDefaultTipoEquipoDto,
  FilterPlanDefaultTipoEquipoDto,
  UpdatePlanDefaultTipoEquipoDto,
} from '@equipos/presentation/dto';
import { AuditTipoEquipoService } from '../../audit/audit-tipo-equipo.service';

@Injectable()
export class PlanDefaultTipoEquipoService {
  constructor(
    @Inject(PLAN_DEFAULT_TIPO_EQUIPO_REPOSITORY)
    private readonly repository: PlanDefaultTipoEquipoRepository,
    @Inject(TIPO_EQUIPO_REPOSITORY)
    private readonly tipoEquipoRepository: TipoEquipoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly auditService: AuditTipoEquipoService,
  ) {}

  async create(
    tipoEquipoId: number,
    { tipo, periocidad, diasAntNotif, realizaExterno, formatoId, observaciones }: CreatePlanDefaultTipoEquipoDto,
  ): Promise<PlanDefaultTipoEquipoRead> {
    await this.ensureTipoEquipoExists(tipoEquipoId);
    const planDefault = PlanDefaultTipoEquipo.create(
      tipoEquipoId, tipo, periocidad?.valor, periocidad?.unidad, diasAntNotif, realizaExterno, formatoId, observaciones,
    );
    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(planDefault);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.PLAN_AGREGADO,
        valorNuevo: tipo,
        observaciones: `Plan por defecto "${tipo}" agregado`,
      });
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async findById(
    tipoEquipoId: number,
    planId: number,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<PlanDefaultTipoEquipo | null> {
    const planFound = await this.repository.findById(planId);
    if (!planFound || planFound.getTipoEquipoId.getValor !== tipoEquipoId) {
      if (options.throwIfNotFound) {
        throw new ResourceNotFoundError(
          `PlanDefaultTipoEquipo con id: ${planId} no encontrado en tipoEquipo: ${tipoEquipoId}`,
        );
      }
      return null;
    }
    return planFound;
  }

  async findAll(
    tipoEquipoId: number,
    { search, limit }: FilterPlanDefaultTipoEquipoDto,
  ): Promise<PlanDefaultTipoEquipoRead[]> {
    await this.ensureTipoEquipoExists(tipoEquipoId);
    return this.repository.findAll({ tipoEquipoId, search, limit });
  }

  async update(
    tipoEquipoId: number,
    planId: number,
    data: UpdatePlanDefaultTipoEquipoDto,
  ): Promise<PlanDefaultTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      const planDefault = await this.findById(tipoEquipoId, planId, { throwIfNotFound: true });
      planDefault.update({
        tipo: data.tipo,
        periocidadValor: data.periocidad?.valor,
        periocidadUnidad: data.periocidad?.unidad,
        diasAntNotif: data.diasAntNotif,
        realizaExterno: data.realizaExterno,
        formatoId: data.formatoId,
        observaciones: data.observaciones,
      });
      await this.repository.update(planDefault);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.PLAN_MODIFICADO,
        valorNuevo: planDefault.getTipo,
        observaciones: `Plan "${planDefault.getTipo}" modificado`,
      });
      return this.repository.findViewById(planId);
    });
  }

  async deactivate(tipoEquipoId: number, planId: number): Promise<PlanDefaultTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      const entity = await this.findById(tipoEquipoId, planId, { throwIfNotFound: true });
      entity.inactivar();
      await this.repository.update(entity);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.PLAN_INACTIVADO,
        valorAnterior: entity.getTipo,
        observaciones: `Plan "${entity.getTipo}" inactivado`,
      });
      return this.repository.findViewById(planId);
    });
  }

  private async ensureTipoEquipoExists(tipoEquipoId: number): Promise<void> {
    const exists = await this.tipoEquipoRepository.exists(tipoEquipoId);
    if (!exists) {
      throw new ResourceNotFoundError(`TipoEquipo con id: ${tipoEquipoId} no encontrado`);
    }
  }
}
