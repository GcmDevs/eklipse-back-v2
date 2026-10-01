import { GcmContextType } from '@common/domain/types';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ADNCENATE')
export class CentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ACACODIGO' })
  codigo: string;

  @Column({ name: 'ACANOMBRE' })
  nombre: string;

  context?: GcmContextType;
}
