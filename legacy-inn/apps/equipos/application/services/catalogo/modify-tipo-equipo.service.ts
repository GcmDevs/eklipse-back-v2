import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { AuditTipoEquipo } from '@equipos/domain/entities/catalogo/audit-tipo-equipo.entity';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { AuditTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/audit-tipo-equipo.repository';
import { TipoEquipoRepository } from '@equipos/domain/repositories/catalogo/tipo-equipo.repository';
import { EquiposRepository } from '@equipos/domain/repositories/equipo.repository';
import {
  AUDIT_TIPO_EQUIPO_REPOSITORY,
  EQUIPOS_REPOSITORY,
  TIPO_EQUIPO_REPOSITORY,
} from '@equipos/domain/repositories/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { REFERENCIA_ENTIDAD } from '../../constants';
import { generateCorrelationId } from '../../helpers';
import { AuditEquipoService } from '../../audit/audit-equipo.service';

export interface ChangeCampoTipoEquipo {
  campo: string;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
}

export interface ModifyTipoEquipoInput {
  tipoEquipoId: number;
  cambios: ChangeCampoTipoEquipo[];
  sincronizar: boolean;
  usuarioId: number;
  usuarioNombre: string;
  observaciones?: string;
}

@Injectable()
export class ModifyTipoEquipoService {
  constructor(
    @Inject(TIPO_EQUIPO_REPOSITORY)
    private readonly tipoEquipoRepository: TipoEquipoRepository,
    @Inject(AUDIT_TIPO_EQUIPO_REPOSITORY)
    private readonly auditRepository: AuditTipoEquipoRepository,
    @Inject(EQUIPOS_REPOSITORY)
    private readonly equiposRepository: EquiposRepository,
    private readonly eventoService: AuditEquipoService,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async execute(input: ModifyTipoEquipoInput): Promise<void> {
    const tipoEquipo = await this.tipoEquipoRepository.findById(input.tipoEquipoId);
    if (!tipoEquipo)
      throw new ResourceNotFoundError(`TipoEquipo con id: ${input.tipoEquipoId} no encontrado`);

    const changes = input.cambios.filter(
      cambio => (cambio.valorAnterior ?? null) !== (cambio.valorNuevo ?? null)
    );
    if (!changes.length) return;

    const correlationId = generateCorrelationId();
    const equipoIds = input.sincronizar
      ? await this.equiposRepository.findIdsByTipoEquipoId(input.tipoEquipoId)
      : [];

    await this.txManager.transactional(async () => {
      const fechaCambio = new Date();
      let secuencia = 1;

      for (const cambio of changes) {
        const audit = AuditTipoEquipo.create({
          tipoEquipoId: input.tipoEquipoId,
          tipo: TipoAuditTipoEquipo.CAMPO_MODIFICADO,
          campo: cambio.campo,
          valorAnterior: cambio.valorAnterior ?? null,
          valorNuevo: cambio.valorNuevo ?? null,
          sincronizo: input.sincronizar,
          usuarioId: input.usuarioId,
          usuarioNombre: input.usuarioNombre,
          fechaCambio,
          observaciones: input.observaciones ?? null,
          correlationOid: correlationId,
        });
        await this.auditRepository.save(audit);
        const auditId = audit.getId.getValor;

        if (!input.sincronizar) continue;

        for (const equipoId of equipoIds) {
          await this.eventoService.register({
            equipoId,
            tipo: TipoEventoAuditEquipo.SINCRONIZACION_TIPO_EQUIPO,
            descripcion: this.buildDescripcion(cambio),
            autor: { id: input.usuarioId, nombre: input.usuarioNombre },
            metadata: {
              tipoEquipoId: input.tipoEquipoId,
              campo: cambio.campo,
              valorAnterior: cambio.valorAnterior ?? null,
              valorNuevo: cambio.valorNuevo ?? null,
            },
            referenciaEntidad: REFERENCIA_ENTIDAD.AUDIT_TIPO_EQUIPO,
            referenciaId: auditId,
            correlationId: correlationId,
            secuencia: secuencia++,
          });
        }
      }
    });
  }

  private buildDescripcion(change: ChangeCampoTipoEquipo): string {
    const previous = change.valorAnterior ?? '—';
    const nnew = change.valorNuevo ?? '—';
    return `Sincronizacion desde tipo de equipo: "${change.campo}" cambio de "${previous}" a "${nnew}"`;
  }
}
