import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { getUser } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import { IAccesorioUnidadRepository } from '@equipos/domain/repositories/accesorio-unidad.repository';
import { ACCESORIO_UNIDAD_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { AccesorioUnidad } from '@equipos/domain/entities';
import { EstadoAccesorioUnidad, OrigenCambio, TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { AccesorioUnidadRead } from '@equipos/domain/read';
import { REFERENCIA_ENTIDAD } from '../constants';
import { AuditEquipoService } from '../audit/audit-equipo.service';

@Injectable()
export class AccesorioUnidadService {
  constructor(
    @Inject(ACCESORIO_UNIDAD_REPOSITORY)
    private readonly repository: IAccesorioUnidadRepository,
    private readonly eventoService: AuditEquipoService,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async create(
    equipoId: number,
    accesorioEstandarId: number,
    parteSnap: string,
    estado?: EstadoAccesorioUnidad,
    observaciones?: string
  ): Promise<AccesorioUnidadRead> {
    return this.txManager.transactional(async () => {
      const saved = await this.repository.createFromEstandar(
        equipoId,
        accesorioEstandarId,
        parteSnap,
        estado,
        observaciones
      );
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async createBatch(
    equipoId: number,
    items: Array<{
      accesorioEstandarId: number;
      parteSnap: string;
      estado?: EstadoAccesorioUnidad;
      observaciones?: string;
    }>
  ): Promise<AccesorioUnidadRead[]> {
    return this.txManager.transactional(async () => {
      const results: AccesorioUnidad[] = [];
      for (const item of items) {
        const saved = await this.repository.createFromEstandar(
          equipoId,
          item.accesorioEstandarId,
          item.parteSnap,
          item.estado,
          item.observaciones
        );
        results.push(saved);
      }
      const ids = results.map(r => r.getId.getValor);
      const all = await Promise.all(ids.map(id => this.repository.findViewById(id)));
      return all.filter((r): r is AccesorioUnidadRead => r !== null);
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<AccesorioUnidad | null> {
    const accesorioFound = await this.repository.findById(id);
    if (!accesorioFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`AccesorioUnidad con id: ${id} no encontrado`);
    }
    return accesorioFound;
  }

  async findByEquipoId(equipoId: number): Promise<AccesorioUnidadRead[]> {
    return this.repository.findByEquipoId(equipoId);
  }

  async changeEstado(
    equipoId: number,
    id: number,
    estado: EstadoAccesorioUnidad
  ): Promise<AccesorioUnidadRead> {
    if (estado == null) {
      throw new BadInputError('estado es requerido');
    }

    return this.txManager.transactional(async () => {
      await this.assertBelongsToEquipo(equipoId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.changeEstado(estado);
      const saved = await this.repository.update(entity);
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async update(equipoId: number, id: number, observaciones?: string): Promise<AccesorioUnidadRead> {
    return this.txManager.transactional(async () => {
      await this.assertBelongsToEquipo(equipoId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.changeObservaciones(observaciones);
      const saved = await this.repository.update(entity);
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async discontinue(equipoId: number, id: number): Promise<AccesorioUnidadRead> {
    return this.txManager.transactional(async () => {
      await this.assertBelongsToEquipo(equipoId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.descontinue();
      const saved = await this.repository.update(entity);
      await this.registerEventoManual(
        equipoId,
        entity,
        TipoAuditTipoEquipo.ACCESORIO_DESCONTINUADO
      );
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  private async registerEventoManual(
    equipoId: number,
    entity: AccesorioUnidad,
    accion: TipoAuditTipoEquipo,
    referenciaId?: number
  ): Promise<void> {
    const usuario = getUser();
    await this.eventoService.register({
      equipoId,
      tipo: TipoEventoAuditEquipo.ACCESORIO_ACTUALIZADO,
      descripcion: this.buildDescripcionManual(accion, entity.getParteSnap),
      autor: { id: usuario.id, nombre: usuario.nombre },
      metadata: {
        origen: OrigenCambio.MANUAL,
        accion,
        accesorioEstandarId: entity.getAccesorioEstandarId.getValor,
        parteSnap: entity.getParteSnap,
      },
      referenciaEntidad: REFERENCIA_ENTIDAD.ACCESORIO_UNIDAD,
      referenciaId: referenciaId ?? entity.getId.getValor,
    });
  }

  private buildDescripcionManual(accion: TipoAuditTipoEquipo, parteSnap: string): string {
    return accion === TipoAuditTipoEquipo.ACCESORIO_DESCONTINUADO
      ? `Accesorio "${parteSnap}" descontinuado manualmente del equipo`
      : 'Accesorio Modificado';
  }

  private async assertBelongsToEquipo(equipoId: number, id: number): Promise<AccesorioUnidad> {
    const current = await this.repository.findById(id);
    if (!current || current.getEquipoId.getValor !== equipoId) {
      throw new ResourceNotFoundError(
        `AccesorioUnidad con id: ${id} no encontrado para el equipo ${equipoId}`
      );
    }
    return current;
  }
}
