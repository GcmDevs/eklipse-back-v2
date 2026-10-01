import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { AuthorityOrm } from './authority.orm';
import { SubModuleOrm } from './sub-module.orm';

@Entity('EKGENMODULO')
export class ModuleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  code: string;

  @Column({ name: 'NOMBRE' })
  name: string;

  @Column({ name: 'ACTIVO' })
  isActive: boolean;

  @OneToMany(() => AuthorityOrm, authority => authority.module)
  authorities: AuthorityOrm[];

  @OneToMany(() => SubModuleOrm, subModule => subModule.module)
  subModules: SubModuleOrm[];
}
