import { GcmContexts } from '@inn/old/common/application/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ADNCENATE')
export class SDBGENCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'CONTEXTO' })
  contexto: GcmContexts;
}
