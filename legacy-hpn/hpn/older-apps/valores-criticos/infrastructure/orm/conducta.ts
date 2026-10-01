import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ValorCriticoOrm } from './valor-critico';

@Entity('EKHPNHISTOCONDUCTA')
export class ConductaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ValorCriticoOrm)
  @JoinColumn([{ name: 'HPNREPVALCRI', referencedColumnName: 'id' }])
  valorCritico: ValorCriticoOrm;

  @Column({ name: 'HPNREPVALCRI' })
  valorCriticoId: number;

  @Column({ name: 'CONDUCTA' })
  conducta: string;

  @Column({ name: 'AUDOBSERVA' })
  observacion: string;
}
