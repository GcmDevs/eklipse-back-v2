import { AuditTipoEquipo } from '@inn/activos/identificacion/domain/entities/catalogo/audit-tipo-equipo.entity';
import { AuditTipoEquipoRead } from '@inn/activos/identificacion/domain/read';

export interface AuditTipoEquipoRepository {
  save(audit: AuditTipoEquipo): Promise<void>;
  findByTipoEquipoId(tipoEquipoId: number): Promise<AuditTipoEquipoRead[]>;
}
