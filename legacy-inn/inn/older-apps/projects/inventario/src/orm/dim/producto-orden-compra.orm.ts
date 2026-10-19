import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNMORDEN')
export class InnProductoOrdenCompraOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNCORDEN' })
  ordenCompraId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @Column({ name: 'IDDCANTID' })
  cantidad: number;

  @Column({ name: 'IMOVALUNP' })
  precioUnitario: number;
}
