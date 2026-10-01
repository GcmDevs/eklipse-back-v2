import { GcmContextType } from '@common/domain/types';
import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm';

@Entity({ name: 'GCMHPNGESTOBS' })
export class GTCObservacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GCMHPNGEST' })
  management: number;

  @Column({ name: 'CONTENIDO' })
  content: string;

  @Column({ name: 'GENUSUARIO' })
  author: number;

  @Column({ name: 'FECHREGISTRO' })
  createdAt: Date;

  @Column({ name: 'ACTUALIZADO' })
  wasUpdated: boolean;

  @Column({ name: 'CODIGOCENATE' })
  codigoCentro: number;

  contexto: GcmContextType;
  authorFullName: string;
}
