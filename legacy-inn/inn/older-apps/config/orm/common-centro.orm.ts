import { GcmContextCode } from '@common/domain/types';
import { GcmContexts } from '@inn/old/common/application/constants';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('ADNCENATE')
export class CommonCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO', length: 10 })
  codigo: string;

  @Column({ name: 'NOMBRE', length: 100 })
  nombre: string;

  @Column({ name: 'CONTEXTO', length: 10 })
  contexto: GcmContextCode;
}
