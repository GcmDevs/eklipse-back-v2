import { PacTrazCategoriaPreguntaCode } from '@hpn/pacientes/domain/types';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'EKHPNPACTRAZENCPREGUN' })
export class PacTrazPreguntaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CATEGORIA' })
  categoriaCode: PacTrazCategoriaPreguntaCode;

  @Column({ name: 'ENUMERADO' })
  enumerado: number;

  @Column({ name: 'DESCRIPCION' })
  descripcion: string;
}
