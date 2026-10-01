import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ContratoOrm } from './contrato.orm';

@Entity('GENDETCON')
export class DetalleContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: string;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  @ManyToOne(() => ContratoOrm)
  @JoinColumn([{ name: 'GENCONTRA1', referencedColumnName: 'id' }])
  contrato: ContratoOrm;

  @Column({ name: 'GENCONTRA1' })
  contratoId: number;
}
