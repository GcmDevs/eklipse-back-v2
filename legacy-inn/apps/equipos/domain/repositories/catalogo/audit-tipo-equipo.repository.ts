import { AuditTipoEquipo } from '@equipos/domain/entities/catalogo/audit-tipo-equipo.entity';
import { AuditTipoEquipoRead } from '@equipos/domain/read';

export interface AuditTipoEquipoRepository {
  save(audit: AuditTipoEquipo): Promise<void>;
  findByTipoEquipoId(tipoEquipoId: number): Promise<AuditTipoEquipoRead[]>;
}
