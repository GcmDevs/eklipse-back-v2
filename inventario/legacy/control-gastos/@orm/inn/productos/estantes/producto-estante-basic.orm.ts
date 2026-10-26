import { Column, Entity, PrimaryColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.pdt.stt.estanteProducto)
export class ProductoEstanteBasicOrm {
  @PrimaryColumn({ name: 'INNPRODUC', type: 'int' })
  productoId: number;

  @PrimaryColumn({ name: 'EKINNESTANT', type: 'int' })
  estanteId: number;

  @Column({ name: 'STOCK', scale: 4 })
  stock: number;

  @Column({ name: 'ISACTIVO', type: 'tinyint' })
  isActivo: boolean;
}
