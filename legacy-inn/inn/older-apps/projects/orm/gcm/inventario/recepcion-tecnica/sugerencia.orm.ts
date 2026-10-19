import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TipoSugerenciaTypeCode } from './types';

@Entity('GCMRECTECLIST')
export class RecTecSugerenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'TIPO' })
  tipo: TipoSugerenciaTypeCode;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;
}
