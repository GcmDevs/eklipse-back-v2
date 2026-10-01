import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { GcmContextType } from '@common/domain/types';

@Entity(TABLE_NAMES.adn.centros)
export class CentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ACACODIGO' })
  codigo: string;

  @Column({ name: 'ACANOMBRE' })
  nombre: string;

  /** @deprecated */
  contexto: GcmContextType;
}
