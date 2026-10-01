import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('HPNDEFCAM')
export class Hpndefcam {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HPNSUBGRU' })
  idSubgroup: number;

  @Column({ name: 'ADNCENATE' })
  center: number;
}
