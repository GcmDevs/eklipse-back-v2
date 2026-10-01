import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';
import { ServicioIpsOrm } from './servicio.orm';

@Entity('EKSLNAGRUPD')
export class AgrupadorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'PESO', type: 'decimal', scale: 2 })
  peso: number;

  @ManyToOne(() => AgrupadorOrm)
  @JoinColumn([{ name: 'EKSLNAGRUPD', referencedColumnName: 'id' }])
  agrupador: AgrupadorOrm;

  @Column({ name: 'EKSLNAGRUPD' })
  agrupadorId: number;

  @ManyToMany(() => ServicioIpsOrm, servicio => servicio.agrupadores)
  servicios: ServicioIpsOrm[];
}
