import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProveedorOrm } from '../../../gen/proveedor.orm';
import { AlmacenOrm } from '../../../../legacy/control-gastos/@orm/inn/productos';
import { DetalleOrdenTrasladoOrm } from './detalle.orm';

@Entity('INNTRASPROD')
export class OrdenTrasladoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ITPDETALLE' })
  descripcion: string;

  @Column({ name: 'GENPROVEE' })
  proveedorId: number;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn([{ name: 'GENPROVEE', referencedColumnName: 'id' }])
  proveedor: ProveedorOrm;

  @Column({ name: 'INNALMCONSIG' })
  almacenConsignacionId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: 'INNALMCONSIG', referencedColumnName: 'id' }])
  almacenConsignacion: AlmacenOrm;

  @Column({ name: 'INNALMPROPIO' })
  almacenDestinoId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: 'INNALMPROPIO', referencedColumnName: 'id' }])
  almacenDestino: AlmacenOrm;

  @OneToMany(() => DetalleOrdenTrasladoOrm, item => item.orden)
  detalle: DetalleOrdenTrasladoOrm[];
}
