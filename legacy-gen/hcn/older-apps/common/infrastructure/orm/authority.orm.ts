import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { UserOrm } from './user.orm';
import { ModuleOrm } from './module.orm';
import { RoleOrm } from './role.orm';
import { SubModuleOrm } from './sub-module.orm';

@Entity('GCMMODULOS')
export class AuthorityOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'EKCODIGO' })
  code: string;

  @Column({ name: 'NOMBRE' })
  name: string;

  @Column({ name: 'ACTIVO' })
  isActive: boolean;

  @ManyToOne(() => ModuleOrm, module => module.authorities)
  @JoinColumn({ name: 'EKGENMODULO' })
  module: ModuleOrm;

  @ManyToOne(() => SubModuleOrm, subModule => subModule.authorities)
  @JoinColumn({ name: 'EKGENSUBMODULO' })
  subModule: SubModuleOrm;

  @ManyToMany(() => RoleOrm, role => role.authorities)
  roles: RoleOrm[];

  @ManyToMany(() => UserOrm, user => user.authorities)
  users: UserOrm[];

  // Just Id's
  @Column({ name: 'EKGENMODULO' })
  moduleId: number;

  @Column({ name: 'EKGENSUBMODULO' })
  subModuleId: number;

  // Custom variables & functions
  isByRol?: boolean;
}
