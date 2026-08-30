import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductoOrm } from '../productos';

@Entity('EKINNCTCPFBSET')
export class SetOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE', length: 300 })
  nombre: string;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;

  @ManyToMany(() => ProductoOrm, producto => producto.sets)
  @JoinTable({
    name: 'EKINNCTCPFBSETINNPRODUC',
    joinColumn: { name: 'EKINNCTCPFBSET', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'INNPRODUC', referencedColumnName: 'id' },
  })
  productos: ProductoOrm[];
}
