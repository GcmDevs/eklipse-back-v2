import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('INNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO', length: 20 })
  codigo: string;

  @Column({ name: 'IPRDESCOR', length: 300 })
  descripcionCorta: string;

  @Column({ name: 'IPRDESLAR', length: 3000 })
  descripcionLarga: string;
}
