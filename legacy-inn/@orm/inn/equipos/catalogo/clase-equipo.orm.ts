import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { TipoActivoOrm } from './tipo-activo.orm';
import { SubclaseEquipoOrm } from './subclase-equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.clases_equipo })
@Unique('UQ_EKINNEQPCLASESEQUIPO_CODIGO', ['codigo'])
export class ClaseEquipoOrm extends BaseTimestampedOrm {
  @ManyToOne(() => TipoActivoOrm, tipo => tipo.clases)
  @JoinColumn({ name: 'TIPOACTIVOOID' })
  tipoActivo: TipoActivoOrm;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 120 })
  nombre: string;

  @Column({ name: 'CODIGO', type: 'varchar', length: 30 })
  codigo: string;

  @Column({ name: 'DESCRIPCION', type: 'nvarchar', length: 300, nullable: true })
  descripcion?: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => SubclaseEquipoOrm, sub => sub.clase)
  subclases: SubclaseEquipoOrm[];
}
