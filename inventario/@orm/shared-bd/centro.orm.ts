import { GcmContextCode } from '@common/domain/types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ADNCENATE')
export class SRDCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'ORIGINALID' })
  originalId: number;

  @Column({ name: 'CONTEXTO' })
  contextCode: GcmContextCode;
}
