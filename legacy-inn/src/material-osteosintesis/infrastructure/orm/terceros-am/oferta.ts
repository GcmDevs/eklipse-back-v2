import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EkinnoferProveedorOrm } from '@orm/inn/ofertas';
import { OfertaDetalleOrm } from './oferta.detalle';

@Entity('EKINNOFERMAOSET')
export class OfertaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNMOSET' })
  setId: number;

  @Column({ name: 'EKINNOFERPROVEEDOR' })
  proveedorId: number;

  @ManyToOne(() => EkinnoferProveedorOrm)
  @JoinColumn({ name: 'EKINNOFERPROVEEDOR', referencedColumnName: 'id' })
  proveedor: EkinnoferProveedorOrm;

  @Column({ name: 'CREATEDAT' })
  fechaCreacion: Date;

  @Column({ name: 'ISACTIVO' })
  isActivo: boolean;

  @Column({ name: 'ISMODIFICADO' })
  isModificado: boolean;

  @OneToMany(() => OfertaDetalleOrm, detalle => detalle.oferta)
  detalle: OfertaDetalleOrm[];
}
