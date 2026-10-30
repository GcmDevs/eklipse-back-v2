import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { DepartamentoOrm } from './departamento.orm';
import { BaseOrm } from '@common/infrastructure/orm';

@Entity({ name: 'GENMUNICI' })
export class MunicipioOrm extends BaseOrm {
  @Column({
    name: 'MUNCODMUN',
    type: 'varchar',
    length: 3,
  })
  codigo: string;

  @ManyToOne(() => DepartamentoOrm, departamento => departamento.municipios, {
    nullable: false,
  })
  @JoinColumn({
    name: 'GENDEPTO',
  })
  departamento: DepartamentoOrm;

  @Column({
    name: 'MUNNOMMUN',
    type: 'varchar',
    length: 40,
  })
  nombre: string;

  @Column({
    name: 'MUNURBRUR',
    type: 'int',
    nullable: true,
  })
  zona?: number;

  @Column({
    name: 'MUNCODDEMU',
    type: 'varchar',
    length: 5,
    nullable: true,
  })
  codigoDepartamentoMunicipio?: string;

  @Column({
    name: 'RITCIUDAD',
    type: 'int',
    nullable: true,
  })
  ritCiudad?: number;

  @Column({
    name: 'GECODSIUS',
    type: 'varchar',
    length: 8,
    nullable: true,
  })
  codigoSius?: string;
}
