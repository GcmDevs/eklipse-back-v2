import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { TipoEquipoOrm } from './tipo-equipo.orm';
import { MarcaOrm } from '../marca';
import { AccesorioUnidadOrm } from '../accesorio-unidad.orm';
import { ParteCatgOrm } from './parte-catg.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.tipo_eqp_accesorios })
export class AccesorioTipoEquipoOrm extends BaseOrm {
  @ManyToOne(() => TipoEquipoOrm, tipo => tipo.accesoriosEstandar)
  @JoinColumn({ name: 'TIPOEQUIPOOID' })
  tipoEquipo: TipoEquipoOrm;

  @ManyToOne(() => ParteCatgOrm)
  @JoinColumn({ name: 'PARTEOID' })
  parte: ParteCatgOrm;

  @Column({ name: 'PARTESNAP', type: 'varchar', length: 120 })
  parteSnap: string;

  @ManyToOne(() => MarcaOrm, { nullable: true })
  @JoinColumn({ name: 'MARCAOID' })
  marca?: MarcaOrm;

  @Column({ name: 'CANTIDAD', type: 'int' })
  cantidad: number;

  @Column({ name: 'REFERENCIA', type: 'varchar', length: 80, nullable: true })
  referencia?: string;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 300, nullable: true })
  observaciones?: string;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;

  @OneToMany(() => AccesorioUnidadOrm, au => au.accesorioEstandar)
  accesoriosUnidad: AccesorioUnidadOrm[];
}
