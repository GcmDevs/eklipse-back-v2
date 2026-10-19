import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstanteAlmacenOrm, ProductoOrm } from '@inn/orm/inn';
import { UsuarioOrm } from '@inn/orm/gen';
import { INN_CICLICO_TABLE_NAMES } from './table-names';

@Entity(INN_CICLICO_TABLE_NAMES.reporteExistenciaProducto)
export class ReporteExistenciaProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => EstanteAlmacenOrm)
  @JoinColumn([{ name: 'EKINNESTANT', referencedColumnName: 'id' }])
  estante: EstanteAlmacenOrm;

  @Column({ name: 'EKINNESTANT' })
  estanteId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @Column({ name: 'STOCK' })
  stock: number;
}
