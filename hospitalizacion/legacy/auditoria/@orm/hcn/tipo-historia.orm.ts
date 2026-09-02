import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.hcn.folios.tipoHistoria)
export class TipoHistoriaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCCODIGO' })
  codigo: string;

  @Column({ name: 'HCNOMBRE' })
  nombre: string;
}
