import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('HPNSUBGRU')
export class SubgrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HSUCODIGO' })
  codigo: string;

  @Column({ name: 'HSUNOMBRE' })
  nombre: string;
}
