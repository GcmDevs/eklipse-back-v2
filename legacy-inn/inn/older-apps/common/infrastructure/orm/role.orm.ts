import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { UserOrm } from './user.orm';
import { AuthorityOrm } from './authority.orm';

@Entity('GENROL')
export class RoleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ROLNOMBRE' })
  name: string;

  @OneToMany(() => UserOrm, user => user.role)
  users: UserOrm[];

  @ManyToMany(() => AuthorityOrm, authority => authority.roles)
  @JoinTable({
    name: 'GCMMODULOROL',
    joinColumn: {
      name: 'GENROL',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'GCMMODULO',
      referencedColumnName: 'id',
    },
  })
  authorities: AuthorityOrm[];
}
