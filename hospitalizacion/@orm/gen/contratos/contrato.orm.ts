import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DetalleContratoOrm } from './detalle.orm';

@Entity('GENCONTRA')
export class ContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GECCODIGO' })
  codigo: string;

  @Column({ name: 'GECNOMENT' })
  nombre: string;

  @OneToMany(() => DetalleContratoOrm, detalle => detalle.contrato)
  detalles: DetalleContratoOrm[];
}
