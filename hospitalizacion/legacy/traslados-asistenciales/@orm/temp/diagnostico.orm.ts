import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HpnIngresoOrm } from './hpn-ingreso.orm';

@Entity('GENDIAGNO')
export class DiagnosticoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DIACODIGO' })
  codigo: string;

  @Column({ name: 'DIANOMBRE' })
  nombre: string;

  @OneToMany(() => HpnIngresoOrm, ingreso => ingreso)
  ingresos: HpnIngresoOrm[];
}
