import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductoOrm } from './producto.orm';
import { LoteProductoOrm } from './lote.orm';

@Entity('INNFISICO')
export class ExistenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNALMACE' })
  almacenId: number;

  @ManyToOne(() => ProductoOrm, producto => producto.existencias)
  @JoinColumn({ name: 'INNPRODUC' })
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: 'INNLOTSER', referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: 'INNLOTSER' })
  loteId: number;

  @Column({ name: 'IFICANTID', scale: 2 })
  cantidad: number;
}
