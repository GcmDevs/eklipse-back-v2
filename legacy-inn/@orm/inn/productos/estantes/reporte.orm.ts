import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { VerificacionOrm } from '@orm/inn/productos/estantes';
import { ProductoOrm } from '@orm/inn/productos';

@Entity(TABLE_NAMES.inn.pdt.stt.reportes)
export class ReporteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.productos, referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos })
  productoId: number;

  @ManyToOne(() => VerificacionOrm, verificacion => verificacion.reportes)
  @JoinColumn({ name: TABLE_NAMES.inn.pdt.stt.verificaciones })
  verificacion: VerificacionOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.stt.verificaciones })
  verificacionId: number;

  @Column({ name: 'STOCK', scale: 4 })
  stock: number;

  @Column({ name: 'DIMSTOCK', scale: 4 })
  dimStock: number;
}
