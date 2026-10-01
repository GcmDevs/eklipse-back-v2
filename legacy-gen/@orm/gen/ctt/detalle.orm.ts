import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { ContratoOrm } from './contrato.orm';

@Entity(TABLE_NAMES.gen.ctt.detalle)
export class DetalleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: number;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  @ManyToOne(() => ContratoOrm)
  @JoinColumn({ name: `${TABLE_NAMES.gen.ctt.contratos}1` })
  contrato: ContratoOrm;

  @Column({ name: `${TABLE_NAMES.gen.ctt.contratos}1` })
  contratoId: number;
}
