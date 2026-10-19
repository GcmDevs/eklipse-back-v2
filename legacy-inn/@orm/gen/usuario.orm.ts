import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { RSAServices } from '@common/application/services';
import { DependenciaOrm } from './dependencia.orm';

@Entity({ name: TABLE_NAMES.gen.usu.usuarios, synchronize: false })
export class UsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUNOMBRE' })
  cedula: string;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @ManyToMany(() => DependenciaOrm, dependencia => dependencia.usuarios)
  @JoinTable({
    name: TABLE_NAMES.gen.usu.dependencias,
    joinColumn: { name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' },
    inverseJoinColumn: { name: TABLE_NAMES.gen.dependencias, referencedColumnName: 'id' },
  })
  dependencias: DependenciaOrm[];

  encryptId() {
    this.id = RSAServices.encryptId(this.id) as any;
  }

  decryptId() {
    this.id = RSAServices.decryptId(this.id as any);
  }
}
