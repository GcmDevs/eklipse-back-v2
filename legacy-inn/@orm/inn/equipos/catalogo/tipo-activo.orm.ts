import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { ClaseEquipoOrm } from './clase-equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.tipos_activo })
@Unique('UQ_EKINNEQPTIPOSACTIVO_NOMBRE', ['nombre'])
@Unique('UQ_EKINNEQPTIPOSACTIVO_CODIGO', ['codigo'])
export class TipoActivoOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'varchar', length: 80 })
  nombre: string;

  @Column({ name: 'CODIGO', type: 'varchar', length: 20 })
  codigo: string;

  @Column({ name: 'DESCRIPCION', type: 'nvarchar', length: 300, nullable: true })
  descripcion?: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => ClaseEquipoOrm, clase => clase.tipoActivo)
  clases: ClaseEquipoOrm[];
}
