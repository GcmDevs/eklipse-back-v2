import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { RoleOrm } from './role.orm';
import { AuthorityOrm } from './authority.orm';

@Entity('GENUSUARIO')
export class UserOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => RoleOrm, role => role.users)
  @JoinColumn({ name: 'GENROL' })
  role: RoleOrm;

  @Column({ name: 'USUDESCRI' })
  fullName: string;

  @Column({ name: 'USUNOMBRE' })
  document: string;

  @Column({ name: 'USUCLAVE' })
  password: string;

  @Column({ name: 'USUESTADO', type: 'smallint' })
  status: number;

  @ManyToMany(() => AuthorityOrm, authority => authority.users)
  @JoinTable({
    name: 'GCMUSUPERMISO',
    joinColumn: {
      name: 'IDUSUARIO',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'IDMODULO',
      referencedColumnName: 'id',
    },
  })
  authorities: AuthorityOrm[];
}
