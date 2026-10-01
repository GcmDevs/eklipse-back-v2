import { Column, Entity, PrimaryColumn } from 'typeorm';
import { AgrupadorOrm } from './agrupador.orm';

@Entity('EKSLNAGRUSERVTIP')
export class AgrupadorServicioIpsBasicOrm {
  @PrimaryColumn({ name: 'GENSERIPS', type: 'int' })
  servicioId: number;

  @PrimaryColumn({ name: 'EKSLNAGRUPD', type: 'int' })
  agrupadorId: number;

  @Column({ name: 'TIPO' })
  tipo: number;

  @Column({ name: 'ASEVENTO' })
  isEvento: boolean;

  agrupador: AgrupadorOrm;
}
