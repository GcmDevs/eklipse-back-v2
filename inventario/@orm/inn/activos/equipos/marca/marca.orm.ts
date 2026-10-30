import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { ModeloOrm } from './modelo.orm';

@Entity({ name: TABLE_NAMES.cor.marca.marcas })
@Unique('UQ_EKCORMARCAS_NOMBRE', ['nombre'])
export class MarcaOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'varchar' })
  nombre: string;

  @Column({ name: 'DESCRIPCION', type: 'varchar', nullable: true })
  descripcion?: string;

  @OneToMany(() => ModeloOrm, modelos => modelos.marca)
  modelos: ModeloOrm[];
}
