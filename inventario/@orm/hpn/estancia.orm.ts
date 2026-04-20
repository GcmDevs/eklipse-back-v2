import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { IngresoOrm } from '../adn';

@Entity('HPNESTANC')
export class EstanciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm, ingreso => ingreso.estancias)
  @JoinColumn([{ name: 'ADNINGRES', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRES' })
  ingresoId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn([{ name: 'HPNDEFCAM', referencedColumnName: 'id' }])
  cama: CamaOrm;

  @Column({ name: 'HPNDEFCAM' })
  CamaId: number;

  @Column({ name: 'HESFECING' })
  fechaIngreso: Date;

  @Column({ name: 'HESFECSAL' })
  fechaEgreso: Date;

  @Column({ name: 'HESCANEST' })
  dias: number;

  @Column({ name: 'HESVALEST' })
  valor: number;

  @Column({ name: 'HESTRAURG' })
  esTrasladoAUrgencia: boolean;
}
