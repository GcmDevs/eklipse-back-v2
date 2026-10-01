import { DetalleSuministroPacienteOrm } from '@inn/orm/inn';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DevolucionSumPacOrm } from './devolucion-suministro.orm';

@Entity('EKINNDOCUSOMEDEV')
export class DetalleDevSumOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DevolucionSumPacOrm, remisionEntrada => remisionEntrada.detalle)
  @JoinColumn({ name: 'INNDOCDEVMED', referencedColumnName: 'id' })
  devolucion: DevolucionSumPacOrm;

  @ManyToOne(() => DetalleSuministroPacienteOrm)
  @JoinColumn([{ name: 'INNMSUMPA', referencedColumnName: 'id' }])
  suministro: DetalleSuministroPacienteOrm;

  @Column({ name: 'INNDOCDEVMED' })
  devolucionId: number;

  @Column({ name: 'INNMSUMPA' })
  suministroId: number;

  @Column({ name: 'ESTADO' })
  estadoCode: 1 | 2 | 3;
}
