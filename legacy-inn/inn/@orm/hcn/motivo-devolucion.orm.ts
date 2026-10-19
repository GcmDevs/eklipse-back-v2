import { DetalleSuministroPacienteOrm } from '@inn/orm/inn';
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';

@Entity('HCNDEVMEDD')
export class MotivoDevolucionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DetalleSuministroPacienteOrm, detalle => detalle.motivosDevolucion)
  @JoinColumn({ name: 'INNMSUMPA', referencedColumnName: 'id' })
  suministroPaciente: DetalleSuministroPacienteOrm;

  @Column({ name: 'INNMSUMPA' })
  suministroId: number;

  @Column({ name: 'HCSCANTID', precision: 2 })
  cantidad: number;

  @Column({ name: 'HCSMOTIVO' })
  motivo: string;
}
