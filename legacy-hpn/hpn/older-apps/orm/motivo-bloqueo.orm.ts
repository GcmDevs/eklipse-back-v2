import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BloqueoCamaCode } from '../types/bloqueo-cama';
import { BloqueoCamaOrm } from './bloquear-cama.orm';

@Entity('EKHPNBLOMOTIVO')
export class MotivoBloqueoCamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'BLOQUEOID' })
  bloqueoId: number;

  @ManyToOne(() => BloqueoCamaOrm, bloqueo => bloqueo.motivos)
  @JoinColumn({ name: 'BLOQUEOID' })
  bloqueo: BloqueoCamaOrm;

  @Column({ name: 'MOTIVO' })
  motivo: BloqueoCamaCode;
}
