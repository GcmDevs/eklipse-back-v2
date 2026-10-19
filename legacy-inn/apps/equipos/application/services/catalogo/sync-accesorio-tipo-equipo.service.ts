import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { AuditTipoEquipo } from '@equipos/domain/entities/catalogo/audit-tipo-equipo.entity';
import {
  AccionSincronizacionAccesorio,
  AlcanceSincronizacion,
  EstadoAccesorioUnidad,
  OrigenCambio,
  TipoAuditTipoEquipo,
} from '@equipos/domain/enums';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { AccesorioTipoEquipoRead } from '@equipos/domain/read';
import { IAccesorioUnidadRepository } from '@equipos/domain/repositories/accesorio-unidad.repository';
import { AccesorioTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/accesorio-tipo-equipo.repository';
import { AuditTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/audit-tipo-equipo.repository';
import { EquiposRepository } from '@equipos/domain/repositories/equipo.repository';
import {
  ACCESORIO_TIPO_EQUIPO_REPOSITORY,
  ACCESORIO_UNIDAD_REPOSITORY,
  AUDIT_TIPO_EQUIPO_REPOSITORY,
  EQUIPOS_REPOSITORY,
} from '@equipos/domain/repositories/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { REFERENCIA_ENTIDAD } from '../../constants';
import { generateCorrelationId } from '../../helpers';
import { AuditEquipoService } from '../../audit/audit-equipo.service';

export interface SincronizarAccesorioInput {
  tipoEquipoId: number;
  accesorioEstandarId: number;
  accion: AccionSincronizacionAccesorio;
  alcance: AlcanceSincronizacion;
  equipoIds?: number[];
  usuarioId: number;
  usuarioNombre: string;
  observaciones?: string;
}

export interface PreviewSincronizacionAccesorioRead {
  totalEquipos: number;
  equiposSinActividad: number;
  equiposConAccesorio: number;
}

@Injectable()
export class SyncAccesorioTipoEquipoService {
  constructor(
    @Inject(ACCESORIO_TIPO_EQUIPO_REPOSITORY)
    private readonly accesorioEstandarRepository: AccesorioTipoEquipoRepository,
    @Inject(ACCESORIO_UNIDAD_REPOSITORY)
    private readonly accesorioUnidadRepository: IAccesorioUnidadRepository,
    @Inject(AUDIT_TIPO_EQUIPO_REPOSITORY)
    private readonly auditRepository: AuditTipoEquipoRepository,
    @Inject(EQUIPOS_REPOSITORY)
    private readonly equiposRepository: EquiposRepository,
    private readonly eventoService: AuditEquipoService,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async preview(
    tipoEquipoId: number,
    accesorioEstandarId: number
  ): Promise<PreviewSincronizacionAccesorioRead> {
    await this.resolveAccesorioEstandar(tipoEquipoId, accesorioEstandarId);

    const [todos, sinActividad] = await Promise.all([
      this.equiposRepository.findIdsByTipoEquipoId(tipoEquipoId),
      this.equiposRepository.findIdsByTipoEquipoIdSinActividad(tipoEquipoId),
    ]);
    const conAccesorio = await this.accesorioUnidadRepository.findEquipoIdsConAccesorio(
      accesorioEstandarId,
      todos
    );

    return {
      totalEquipos: todos.length,
      equiposSinActividad: sinActividad.length,
      equiposConAccesorio: conAccesorio.length,
    };
  }

  async execute(input: SincronizarAccesorioInput): Promise<void> {
    const estandar = await this.resolveAccesorioEstandar(
      input.tipoEquipoId,
      input.accesorioEstandarId
    );
    const parteSnap = estandar.parteSnap;

    const equipoIds = await this.resolveEquipoIds(input);
    const auditTipo =
      input.accion === AccionSincronizacionAccesorio.AGREGAR
        ? TipoAuditTipoEquipo.ACCESORIO_AGREGADO
        : TipoAuditTipoEquipo.ACCESORIO_DESCONTINUADO;

    const correlationOid = generateCorrelationId();
    await this.txManager.transactional(async () => {
      const audit = AuditTipoEquipo.create({
        tipoEquipoId: input.tipoEquipoId,
        tipo: auditTipo,
        campo: null,
        valorAnterior:
          input.accion === AccionSincronizacionAccesorio.DESCONTINUAR ? parteSnap : null,
        valorNuevo: input.accion === AccionSincronizacionAccesorio.AGREGAR ? parteSnap : null,
        sincronizo: equipoIds.length > 0,
        usuarioId: input.usuarioId,
        usuarioNombre: input.usuarioNombre,
        fechaCambio: new Date(),
        observaciones: input.observaciones ?? null,
        correlationOid,
      });
      await this.auditRepository.save(audit);
      const auditOid = audit.getId.getValor;

      if (!equipoIds.length) return;

      const equiposAfectados =
        input.accion === AccionSincronizacionAccesorio.AGREGAR
          ? await this.applyAgregar(input.accesorioEstandarId, parteSnap, equipoIds)
          : await this.applyDescontinuar(input.accesorioEstandarId, equipoIds);

      let secuencia = 1;
      for (const equipoId of equiposAfectados) {
        await this.eventoService.register({
          equipoId,
          tipo: TipoEventoAuditEquipo.SINCRONIZACION_TIPO_EQUIPO,
          descripcion: this.buildDescripcion(input.accion, parteSnap),
          autor: { id: input.usuarioId, nombre: input.usuarioNombre },
          metadata: {
            tipoEquipoId: input.tipoEquipoId,
            origen: OrigenCambio.SINCRONIZACION,
            accion: auditTipo,
            accesorioEstandarId: input.accesorioEstandarId,
            parteSnap,
          },
          referenciaEntidad: REFERENCIA_ENTIDAD.AUDIT_TIPO_EQUIPO,
          referenciaId: auditOid,
          correlationId: correlationOid,
          secuencia: secuencia++,
        });
      }
    });
  }

  private async applyAgregar(
    accesorioEstandarId: number,
    parteSnap: string,
    equipoIds: number[]
  ): Promise<number[]> {
    const alreadyHas = new Set(
      await this.accesorioUnidadRepository.findEquipoIdsConAccesorio(accesorioEstandarId, equipoIds)
    );
    const target = equipoIds.filter(id => !alreadyHas.has(id));
    for (const equipoId of target) {
      await this.accesorioUnidadRepository.createFromEstandar(
        equipoId,
        accesorioEstandarId,
        parteSnap,
        EstadoAccesorioUnidad.PENDIENTE
      );
    }
    return target;
  }

  private async applyDescontinuar(
    accesorioEstandarId: number,
    equipoIds: number[]
  ): Promise<number[]> {
    const unidades = await this.accesorioUnidadRepository.findByAccesorioEstandarId(
      accesorioEstandarId,
      equipoIds
    );
    const afectados: number[] = [];
    for (const unidad of unidades) {
      unidad.descontinue();
      await this.accesorioUnidadRepository.update(unidad);
      afectados.push(unidad.getEquipoId.getValor);
    }
    return afectados;
  }

  private async resolveEquipoIds(input: SincronizarAccesorioInput): Promise<number[]> {
    switch (input.alcance) {
      case AlcanceSincronizacion.NINGUNO:
        return [];
      case AlcanceSincronizacion.SIN_ACTIVIDAD:
        return this.equiposRepository.findIdsByTipoEquipoIdSinActividad(input.tipoEquipoId);
      case AlcanceSincronizacion.MANUAL: {
        if (!input.equipoIds?.length) {
          throw new BadInputError('Debe seleccionar al menos un equipo para el alcance MANUAL');
        }
        const delTipo = new Set(
          await this.equiposRepository.findIdsByTipoEquipoId(input.tipoEquipoId)
        );
        const invalids = input.equipoIds.filter(id => !delTipo.has(id));
        if (invalids.length) {
          throw new BadInputError(
            `Los equipos [${invalids.join(', ')}] no pertenecen al tipo de equipo ${input.tipoEquipoId}`
          );
        }
        return input.equipoIds;
      }
      default:
        throw new BadInputError(`Alcance de sincronización no soportado: ${input.alcance}`);
    }
  }

  private async resolveAccesorioEstandar(
    tipoEquipoId: number,
    accesorioEstandarId: number
  ): Promise<AccesorioTipoEquipoRead> {
    const accesorios = await this.accesorioEstandarRepository.findByTipoEquipoId(tipoEquipoId);
    const estandar = accesorios.find(acc => acc.id === accesorioEstandarId);
    if (!estandar) {
      throw new ResourceNotFoundError(
        `Accesorio estandar con id: ${accesorioEstandarId} no encontrado para el tipo de equipo ${tipoEquipoId}`
      );
    }
    return estandar;
  }

  private buildDescripcion(accion: AccionSincronizacionAccesorio, parteSnap: string): string {
    return accion === AccionSincronizacionAccesorio.AGREGAR
      ? `Accesorio "${parteSnap}" agregado por sincronizacion desde el tipo de equipo`
      : `Accesorio "${parteSnap}" descontinuado por sincronizacion desde el tipo de equipo`;
  }
}
