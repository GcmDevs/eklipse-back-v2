import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNMORDACTNET')
export class DetalleOrdenActivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNCORDEN' })
  ordenId: number;

  @Column({ name: 'AFNPRODUC' })
  productoId: number;

  @Column({ name: 'IDDCANTID' })
  cantidad: number;

  @Column({ name: 'IMOVALUNP' })
  valorCOP: number;

  @Column({ name: 'IMOPORIVA', type: 'money', scale: 4 })
  porcIVA: number;
}
