import { TABLE_NAMES } from '@common/application/constants';
import { GcmContexts } from '@common/domain/types';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.adn.centros)
export class CentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ACACODIGO' })
  codigo: string;

  @Column({ name: 'ACANOMBRE' })
  nombre: string;

  nit: string;
  contexto: GcmContexts;
}
