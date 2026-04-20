import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { DependenciaOrm } from './dependencia.orm';

@Entity({ name: 'GENUSUARIO' })
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUNOMBRE' })
  cedula: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @ManyToMany(() => DependenciaOrm, dependencia => dependencia.usuarios)
  @JoinTable({
    name: 'EKGENUSUARIODEPEND',
    joinColumn: { name: 'GENUSUARIO', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'GENDEPEND', referencedColumnName: 'id' },
  })
  dependencias: DependenciaOrm[];
}
