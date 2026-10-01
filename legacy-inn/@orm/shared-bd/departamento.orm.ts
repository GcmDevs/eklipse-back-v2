import { Column, Entity, OneToMany } from 'typeorm';
import { MunicipioOrm } from './municipio.orm';
import { BaseOrm } from '@common/infrastructure/orm';

@Entity({ name: 'GENDEPTO' })
export class DepartamentoOrm extends BaseOrm {
  @Column({
    name: 'DEPCODDEP',
    type: 'varchar',
    length: 2,
  })
  codigo: string;

  @Column({
    name: 'DEPNOMDEP',
    type: 'varchar',
    length: 80,
  })
  nombre: string;

  @Column({
    name: 'GECODSIUS',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  codigoSius?: string;

  @OneToMany(() => MunicipioOrm, municipio => municipio.departamento)
  municipios: MunicipioOrm[];
}
