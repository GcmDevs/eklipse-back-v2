import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { MedicamentoSeleccionOrm } from './medicamento-seleccion.orm';
import { LineaCode } from '@inn/types/inn/central-mezclas';

@Entity('EKINNCTMZMED')
export class MedicamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE', length: 100 })
  nombre: string;

  @Column({ name: 'TIPO' })
  lineaCode: LineaCode;

  @OneToMany(() => MedicamentoSeleccionOrm, seleccion => seleccion.medicamento)
  selecciones: MedicamentoSeleccionOrm[];
}
