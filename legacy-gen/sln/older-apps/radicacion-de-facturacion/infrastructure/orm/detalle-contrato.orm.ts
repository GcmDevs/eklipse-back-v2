import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ContratoOrm } from './contrato.orm';

@Entity('GENDETCON')
export class DetalleContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: number;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  @ManyToOne(() => ContratoOrm)
  @JoinColumn({ name: 'GENCONTRA1' })
  contrato: ContratoOrm;

  @Column({ name: 'GENCONTRA1' })
  contratoId: number;

  get originalColumnName() {
    return 'GENDETCON';
  }
}
