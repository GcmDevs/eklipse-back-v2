import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MunicipioOrm } from './municipio.orm';

@Entity({ name: 'GENDEPTO' })
export class DepartamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DEPCODDEP', type: 'varchar', length: 2 })
  codigo: string;

  @Column({ name: 'DEPNOMDEP', type: 'varchar', length: 80 })
  nombre: string;

  @Column({ name: 'GECODSIUS', type: 'varchar', length: 2, nullable: true })
  codigoSius?: string;

  @OneToMany(() => MunicipioOrm, municipio => municipio.departamento)
  municipios: MunicipioOrm[];
}
