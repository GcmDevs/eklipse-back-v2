import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { GcmContextCode, GcmContextType } from '@common/domain/types';

@Entity(TABLE_NAMES.adn.centros)
export class CentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ACACODIGO' })
  codigo: string;

  @Column({ name: 'ACANOMBRE' })
  nombre: string;

  contexto?: GcmContextCode;
  context?: GcmContextType;
}
