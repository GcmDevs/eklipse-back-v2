import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { ClaseEquipoOrm } from './clase-equipo.orm';
import { TipoEquipoOrm } from './tipo-equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.subclases_equipo })
@Unique('UQ_EKINNEQPSUBCLASESEQUIPO_CODIGO', ['codigo'])
export class SubclaseEquipoOrm extends BaseTimestampedOrm {
  @ManyToOne(() => ClaseEquipoOrm, clase => clase.subclases)
  @JoinColumn({ name: 'CLASEOID' })
  clase: ClaseEquipoOrm;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 120 })
  nombre: string;

  @Column({ name: 'CODIGO', type: 'varchar', length: 30 })
  codigo: string;

  @Column({ name: 'DESCRIPCION', type: 'nvarchar', length: 300, nullable: true })
  descripcion?: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => TipoEquipoOrm, tipo => tipo.subclase)
  tiposEquipo: TipoEquipoOrm[];
}
