import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('HPNSUBGRU')
export class SubgrupoCamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HSUCODIGO' })
  codigo: string;

  @Column({ name: 'HSUNOMBRE' })
  nombre: string;
}
