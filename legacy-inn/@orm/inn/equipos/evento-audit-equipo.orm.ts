import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { Column, Entity } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.eventos })
export class EventoAuditEquipoOrm extends BaseCreatedOrm {
  @Column({ name: 'EQUIPOID', type: 'int' })
  equipoId: number;

  @Column({ name: 'TIPO', type: 'varchar' })
  tipo: TipoEventoAuditEquipo;

  @Column({ name: 'DESCRIPCION', type: 'nvarchar', length: 500 })
  descripcion: string;

  @Column({ name: 'METADATA', type: 'nvarchar', length: 'max', nullable: true })
  metadata?: string;

  @Column({ name: 'USUARIOID', type: 'int', nullable: true })
  usuarioId?: number;

  @Column({ name: 'USUARIONOMBRE', type: 'varchar', nullable: true })
  usuarioNombre?: string;

  @Column({ name: 'REFERENCIAENTIDAD', type: 'varchar', nullable: true })
  referenciaEntidad?: string;

  @Column({ name: 'REFERENCIAOID', type: 'int', nullable: true })
  referenciaId?: number;

  @Column({ name: 'CORRELATIONOID', type: 'nvarchar', length: 21, nullable: true })
  correlationId?: string;

  @Column({ name: 'SECUENCIA', type: 'int', nullable: true })
  secuencia: number;
}
