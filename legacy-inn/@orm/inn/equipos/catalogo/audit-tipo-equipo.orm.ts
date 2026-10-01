import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { Column, Entity } from 'typeorm';


@Entity({ name: TABLE_NAMES.inn.eqp.audit_tipo_equipo })
export class AuditTipoEquipoOrm extends BaseCreatedOrm {
  @Column({ name: 'TIPOEQUIPOOID', type: 'int' })
  tipoEquipoId: number;

  @Column({ name: 'TIPO', type: 'varchar', length: 60 })
  tipo: TipoAuditTipoEquipo;

  @Column({ name: 'CAMPO', type: 'varchar', length: 80, nullable: true })
  campo?: string | null;

  @Column({ name: 'VALORANTERIOR', type: 'nvarchar', length: 'max', nullable: true })
  valorAnterior?: string | null;

  @Column({ name: 'VALORNUEVO', type: 'nvarchar', length: 'max', nullable: true })
  valorNuevo?: string | null;

  @Column({ name: 'SINCRONIZO', type: 'bit', default: false })
  sincronizo: boolean;

  @Column({ name: 'USUARIOID', type: 'int' })
  usuarioId: number;

  @Column({ name: 'USUARIONOMBRE', type: 'varchar', length: 100 })
  usuarioNombre: string;

  @Column({ name: 'FECHACAMBIO', type: 'datetime2' })
  fechaCambio: Date;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 300, nullable: true })
  observaciones?: string | null;

  @Column({ name: 'CORRELATIONOID', type: 'varchar', length: 21 })
  correlationOid: string;

  static create(props: {
    tipoEquipoId: number;
    tipo: TipoAuditTipoEquipo;
    campo?: string | null;
    valorAnterior?: string | null;
    valorNuevo?: string | null;
    sincronizo: boolean;
    usuarioId: number;
    usuarioNombre: string;
    fechaCambio: Date;
    observaciones?: string | null;
    correlationOid: string;
    createdAt: Date;
  }): AuditTipoEquipoOrm {
    const orm = new AuditTipoEquipoOrm();
    orm.tipoEquipoId = props.tipoEquipoId;
    orm.tipo = props.tipo;
    orm.campo = props.campo ?? null;
    orm.valorAnterior = props.valorAnterior ?? null;
    orm.valorNuevo = props.valorNuevo ?? null;
    orm.sincronizo = props.sincronizo;
    orm.usuarioId = props.usuarioId;
    orm.usuarioNombre = props.usuarioNombre;
    orm.fechaCambio = props.fechaCambio;
    orm.observaciones = props.observaciones ?? null;
    orm.correlationOid = props.correlationOid;
    orm.createdAt = props.createdAt;
    return orm;
  }
}
