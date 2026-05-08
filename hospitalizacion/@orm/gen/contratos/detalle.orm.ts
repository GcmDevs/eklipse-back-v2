import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { ContratoOrm } from './contrato.orm';

@Entity('GENDETCON')
export class DetalleContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: string;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  @Column({ name: 'GENCONTRA1' })
  contratoId: number;

  @ManyToOne(() => ContratoOrm, contrato => contrato.detalles)
  @JoinColumn({ name: 'GENCONTRA1' })
  contrato: ContratoOrm;
}
