import { getUser } from '@common/infrastructure/services';
import { AuditTipoEquipo } from '@equipos/domain/entities/catalogo/audit-tipo-equipo.entity';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { AuditTipoEquipoRead } from '@equipos/domain/read';
import { AuditTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/audit-tipo-equipo.repository';
import { AUDIT_TIPO_EQUIPO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { Inject, Injectable } from '@nestjs/common';
import { generateCorrelationId } from '../helpers';

export interface RecordAuditTipoEquipoInput {
  tipoEquipoId: number;
  tipo: TipoAuditTipoEquipo;
  campo?: string | null;
  valorAnterior?: string | null;
  valorNuevo?: string | null;
  observaciones?: string | null;
}

@Injectable()
export class AuditTipoEquipoService {
  constructor(
    @Inject(AUDIT_TIPO_EQUIPO_REPOSITORY)
    private readonly repository: AuditTipoEquipoRepository,
  ) {}

  async record(input: RecordAuditTipoEquipoInput): Promise<void> {
    const usuario = getUser();
    const audit = AuditTipoEquipo.create({
      tipoEquipoId: input.tipoEquipoId,
      tipo: input.tipo,
      campo: input.campo ?? null,
      valorAnterior: input.valorAnterior ?? null,
      valorNuevo: input.valorNuevo ?? null,
      sincronizo: false,
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      fechaCambio: new Date(),
      observaciones: input.observaciones ?? null,
      correlationOid: generateCorrelationId(),
    });
    await this.repository.save(audit);
  }

  async findByTipoEquipo(tipoEquipoId: number): Promise<AuditTipoEquipoRead[]> {
    return this.repository.findByTipoEquipoId(tipoEquipoId);
  }
}
