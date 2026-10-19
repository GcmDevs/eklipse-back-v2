import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { AccesorioTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/accesorio-tipo-equipo.repository';
import { ACCESORIO_TIPO_EQUIPO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { AccesorioTipoEquipo } from '@equipos/domain/entities/catalogo/accesorio-tipo-equipo.entity';
import { AccesorioTipoEquipoRead } from '@equipos/domain/read';
import {
  CreateAccesorioTipoEquipoDto,
  UpdateAccesorioTipoEquipoDto,
} from '@equipos/presentation/dto';
import { AuditTipoEquipoService } from '../../audit/audit-tipo-equipo.service';
import { PartesCatgService } from './partes-catg.service';

@Injectable()
export class AccesorioTipoEquipoService {
  constructor(
    @Inject(ACCESORIO_TIPO_EQUIPO_REPOSITORY)
    private readonly repository: AccesorioTipoEquipoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly partesCatgService: PartesCatgService,
    private readonly auditService: AuditTipoEquipoService
  ) {}

  async create(
    tipoEquipoId: number,
    { parteId, parte, cantidad, marcaId, referencia, observaciones }: CreateAccesorioTipoEquipoDto
  ): Promise<AccesorioTipoEquipoRead> {
    const resolved = await this.partesCatgService.resolveForAccesorio({ parteId, parte });
    const accesorio = AccesorioTipoEquipo.create(
      tipoEquipoId,
      resolved.parteId,
      resolved.parteSnap,
      cantidad,
      marcaId,
      referencia,
      observaciones
    );

    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(accesorio);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.ACCESORIO_AGREGADO,
        valorNuevo: resolved.parteSnap,
        observaciones: `Accesorio "${resolved.parteSnap}" agregado al tipo de equipo`,
      });
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<AccesorioTipoEquipo | null> {
    const accesorioFound = await this.repository.findById(id);
    if (!accesorioFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`AccesorioTipoEquipo con id: ${id} no encontrado`);
    }
    return accesorioFound;
  }

  async findByTipoEquipoId(tipoEquipoId: number): Promise<AccesorioTipoEquipoRead[]> {
    return this.repository.findByTipoEquipoId(tipoEquipoId);
  }

  async update(
    tipoEquipoId: number,
    id: number,
    data: UpdateAccesorioTipoEquipoDto
  ): Promise<AccesorioTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      const current = await this.assertBelongsToTipoEquipo(tipoEquipoId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      const updateData = { ...data } as Partial<{
        parteId: number;
        parteSnap: string;
        cantidad: number;
        marcaId: number;
        referencia: string;
        observaciones: string;
      }>;

      if (data.parte !== undefined || data.parteId !== undefined) {
        const resolved = await this.partesCatgService.resolveForAccesorio({
          parteId: data.parteId ?? current.getParteId.getValor,
          parte: data.parte,
        });
        updateData.parteId = resolved.parteId;
        updateData.parteSnap = resolved.parteSnap;
      }

      delete (updateData as { parte?: string }).parte;
      entity.update(updateData);
      await this.repository.update(entity);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.ACCESORIO_MODIFICADO,
        valorNuevo: entity.getParteSnap,
        observaciones: `Accesorio "${entity.getParteSnap}" modificado manualmente`,
      });
      return this.repository.findViewById(id);
    });
  }

  async deprecar(tipoEquipoId: number, id: number): Promise<AccesorioTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      await this.assertBelongsToTipoEquipo(tipoEquipoId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.deprecar();
      await this.repository.update(entity);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.ACCESORIO_DEPRECADO,
        valorAnterior: entity.getParteSnap,
        observaciones: `Accesorio "${entity.getParteSnap}" deprecado manualmente`,
      });
      return this.repository.findViewById(id);
    });
  }

  private async assertBelongsToTipoEquipo(
    tipoEquipoId: number,
    id: number
  ): Promise<AccesorioTipoEquipo> {
    const current = await this.findById(id);
    if (!current || current.getTipoEquipoId.getValor !== tipoEquipoId) {
      throw new ResourceNotFoundError(
        `AccesorioTipoEquipo con id: ${id} no encontrado para el tipoEquipo ${tipoEquipoId}`
      );
    }
    return current;
  }
}
