import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OfertaDetalleOrm } from './oferta-detalle.orm';
import { ProveedorOrm } from './proveedor.orm';

@Entity('EKINNOFERMAOSET')
export class OfertaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNMOSET' })
  setId: number;

  @Column({ name: 'EKINNOFERPROVEEDOR' })
  proveedorId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn({ name: 'EKINNOFERPROVEEDOR', referencedColumnName: 'id' })
  proveedor: ProveedorOrm;

  @Column({ name: 'CREATEDAT' })
  fechaCreacion: Date;

  @Column({ name: 'ISACTIVO' })
  isActivo: boolean;

  @OneToMany(() => OfertaDetalleOrm, detalle => detalle.oferta)
  detalle: OfertaDetalleOrm[];
}
