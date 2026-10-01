import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('HPNDEFCAM')
export class CamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCACODIGO' })
  codigo: string;

  @Column({ name: 'HCANOMBRE' })
  nombre: string;
}
