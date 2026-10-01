import { TABLE_NAMES } from '@common/application/constants';
import { UsuariosCreativos } from '@common/domain/enums';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { ModoFormato, TipoMantenimiento } from '@equipos/domain/enums';
import { VersionFormatoFmtOrm } from 'apps/motor-formatos/infrastructure';
import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.formatos })
@Index('IDX_EKFMTFORMATOS_TIPO', ['tipo'])
@Index('IDX_EKFMTFORMATOS_ACTIVO', ['activo'])
@Unique('UQ_EKFMTFORMATOS_NOMBRE', ['nombre'])
@Unique('UQ_EKFMTFORMATOS_CODIGO', ['codigo'])
@Unique('UQ_EKFMTFORMATOS_SLUG', ['slug'])
export class FormatoOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'varchar' })
  nombre: string;

  @Column({ name: 'TIPOMANT', type: 'nvarchar', length: 20, enum: TipoMantenimiento })
  tipo: TipoMantenimiento;

  @Column({ name: 'CODIGO', length: 15 })
  codigo: string;

  @Column({ type: 'varchar', length: 145, name: 'SLUG' })
  slug: string;

  @Column({ type: 'nvarchar', length: 300, nullable: true, name: 'DESCRIPCION' })
  descripcion: string | null;

  @Column({ name: 'FORMATOORIGENOID', nullable: true })
  formatoOrigenId: number | null;

  @Column({ name: 'MODO', enum: ModoFormato })
  modoFormato: ModoFormato;

  @OneToMany(() => VersionFormatoFmtOrm, (versionFormat) => versionFormat.formato, { cascade: true })
  versiones: VersionFormatoFmtOrm[];

  @Column({ type: 'bit', default: true, name: 'ACTIVO' })
  activo: boolean;

  @Column({ name: 'CREADOPOR', type: 'nvarchar', length: 30, nullable: false})
  creadoPor: UsuariosCreativos;

  @Column({ name: 'CREADOPOROID' })
  creadoPorId: number | null;
}
