import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ItemCotizadoOrm } from '../central-compras/item-cotizado.orm';
import { SetOrm } from '../central-compras/set.orm';

@Entity('INNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  @Column({ name: 'IPRDESCOR' })
  descripcionCorta: string;

  @Column({ name: 'IPRDESLAR' })
  descripcionLarga: string;

  @Column({ name: 'IPRBLOQUEO' })
  isBloqueado: boolean;

  @Column({ name: 'IPRMARDISP' })
  marca: string;

  @Column({ name: 'IPRCUM' })
  CUM: string;

  @Column({ name: 'IPRCOSTPE', type: 'decimal', precision: 4 })
  precioSugerido: number;

  @OneToMany(() => ItemCotizadoOrm, detalle => detalle.producto)
  ofertas: ItemCotizadoOrm[];

  @ManyToMany(() => SetOrm, set => set.productos)
  sets: SetOrm[];
}
