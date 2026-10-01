import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AlmacenProductoOrm } from './almacen.orm';
import { ProductoOrm } from './producto.orm';
import { LoteProductoOrm } from './lote.orm';

@Entity('INNFISICO')
export class ExistenciaProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => AlmacenProductoOrm)
  @JoinColumn([{ name: 'INNALMACE', referencedColumnName: 'id' }])
  almacen: AlmacenProductoOrm;

  @Column({ name: 'INNALMACE' })
  almacenId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
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

  fechaVencimiento?: Date;

  setTypes(removeTypeCodes?: boolean) {
    //
  }
}
