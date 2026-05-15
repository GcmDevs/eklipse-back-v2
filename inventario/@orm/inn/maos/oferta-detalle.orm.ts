import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OfertaOrm } from './oferta.orm';

@Entity('EKINNOFERMAOSPROD')
export class OfertaDetalleOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNMOSPRODUC' })
  productoId: number;

  @Column({ name: 'EKINNOFERMAOSET' })
  ofertaId: number;

  @ManyToOne(() => OfertaOrm, set => set.detalle)
  @JoinColumn({ name: 'EKINNOFERMAOSET' })
  oferta: OfertaOrm;

  @Column({ name: 'PRECIOUNITARIO', type: 'money', precision: 2 })
  precioUnitario: number;
}
