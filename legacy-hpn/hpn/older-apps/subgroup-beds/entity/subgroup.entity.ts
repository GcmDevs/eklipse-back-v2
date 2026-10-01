import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('HPNSUBGRU')
export class SubgroupBeds {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HSUCODIGO' })
  codigo: string;

  @Column({ name: 'HSUNOMBRE' })
  nombreSubgrupo: string;
}
