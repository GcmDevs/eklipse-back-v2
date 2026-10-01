import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENTERCER')
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC' })
  documento: string;

  @Column({ name: 'TERPRINOM' })
  nombre: string;
}
