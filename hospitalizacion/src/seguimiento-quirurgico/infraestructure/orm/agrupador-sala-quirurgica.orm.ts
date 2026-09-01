import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AgrupadorSalasQuirurgicasOrm } from './agrupador-salas-quirurgicas.orm';

@Entity('EKHPNCIRAGRSAL')
@Index('UQ_EKHPNCIRAGRSAL_AGRUPADOR_SALA', ['agrupadorId', 'salaQx'], { unique: true })
export class AgrupadorSalaQuirurgicaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' }) id: number;
  @Column({ name: 'AGRUPADOR', type: 'int' }) agrupadorId: number;
  @Column({ name: 'SALAQX', type: 'varchar', length: 50 }) salaQx: string;
  @ManyToOne(() => AgrupadorSalasQuirurgicasOrm, agrupador => agrupador.salas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'AGRUPADOR' }) agrupador: AgrupadorSalasQuirurgicasOrm;
}
