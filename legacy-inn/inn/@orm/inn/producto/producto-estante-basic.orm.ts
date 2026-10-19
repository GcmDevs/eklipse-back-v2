import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('EKINNESTANTPRODUC')
export class ProductoEstanteBasicOrm {
  @PrimaryColumn({ name: 'INNPRODUC', type: 'int' })
  productoId: number;

  @PrimaryColumn({ name: 'EKINNESTANT', type: 'int' })
  estanteId: number;

  @Column({ name: 'STOCK' })
  stock: number;
}
