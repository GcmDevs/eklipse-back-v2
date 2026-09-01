import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'INNPRODUC' })
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  @Column({ name: 'IPRDESCOR' })
  nombre: string;

  @Column({ name: 'IPRTIPPRO' })
  tipoProducto: number;
}
