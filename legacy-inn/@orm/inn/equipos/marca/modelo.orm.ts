import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { MarcaOrm } from './marca.orm';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { TABLE_NAMES } from '@common/application/constants';
import { TipoEquipoOrm } from '../catalogo/tipo-equipo.orm';

@Entity({ name: TABLE_NAMES.cor.marca.modelos })
@Unique('UQ_EKINNHDVMODELOS_NOMBRE', ['nombre'])
export class ModeloOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'varchar' })
  nombre: string;

  @ManyToOne(() => MarcaOrm, marca => marca.modelos)
  @JoinColumn({ name: 'MARCAOID' })
  marca: MarcaOrm;

  @OneToMany(() => TipoEquipoOrm, tipo => tipo.modelo)
  tiposEquipo: TipoEquipoOrm[];
}
