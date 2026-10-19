import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  TipoEstanteCode,
  TipoEstanteType,
  tipoEstanteTypeFactory,
} from '@inn/ek-types/inn/productos';
import { AlmacenProductoOrm } from './almacen.orm';
import { ProductoOrm } from './producto.orm';

@Entity('EKINNESTANT')
export class EstanteAlmacenOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPO' })
  tipoCode: TipoEstanteCode;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @ManyToOne(() => AlmacenProductoOrm, almacen => almacen.estantes)
  @JoinColumn({ name: 'INNALMACE', referencedColumnName: 'id' })
  almacen: AlmacenProductoOrm;

  @Column({ name: 'INNALMACE' })
  almacenId: number;

  tipo: TipoEstanteType;

  @ManyToMany(() => ProductoOrm, producto => producto.estantes)
  @JoinTable({
    name: 'EKINNESTANTPRODUC',
    joinColumn: {
      name: 'EKINNESTANT',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'INNPRODUC',
      referencedColumnName: 'id',
    },
  })
  productos: ProductoOrm[];

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = tipoEstanteTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
