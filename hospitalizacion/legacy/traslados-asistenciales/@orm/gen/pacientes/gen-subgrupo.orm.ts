import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENSUBGRU')
export class GenSubgrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GSUCODIGO' })
  codigo: string;

  @Column({ name: 'GSUNOMBRE' })
  nombre: string;

  get originalColumnName() {
    return 'GENSUBGRU';
  }
}
