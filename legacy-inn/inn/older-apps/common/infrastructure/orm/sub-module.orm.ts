import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { AuthorityOrm } from './authority.orm';
import { ModuleOrm } from './module.orm';

@Entity('EKGENSUBMODULO')
export class SubModuleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  code: string;

  @Column({ name: 'NOMBRE' })
  name: string;

  @Column({ name: 'ACTIVO' })
  isActive: boolean;

  @ManyToOne(() => ModuleOrm, module => module.authorities)
  @JoinColumn({ name: 'EKGENMODULO' })
  module: ModuleOrm;

  @Column({ name: 'EKGENMODULO' })
  moduleId: number;

  @OneToMany(() => AuthorityOrm, authority => authority.subModule)
  authorities: AuthorityOrm[];
}
