import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { TipoEstanteCode } from '@ctypes/inn/productos';
import { AlmacenOrm } from '../almacen.orm';
import { ProductoOrm } from '../producto.orm';
import { VerificacionOrm } from './verificacion.orm';

@Entity(TABLE_NAMES.inn.pdt.stt.estantes)
export class EstanteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPO' })
  tipoCode: TipoEstanteCode;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @ManyToOne(() => AlmacenOrm, almacen => almacen.estantes)
  @JoinColumn({ name: TABLE_NAMES.inn.pdt.almacenes, referencedColumnName: 'id' })
  almacen: AlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.almacenes })
  almacenId: number;

  @ManyToOne(() => VerificacionOrm)
  @JoinColumn({
    name: TABLE_NAMES.inn.pdt.stt.verificaciones,
    referencedColumnName: 'id',
  })
  ultimaVerificacion: VerificacionOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.stt.verificaciones })
  ultimaVerificacionId: number;

  @Column({ name: 'MINVERIFVALID' })
  minutosVerificacionValida: number;

  @ManyToMany(() => ProductoOrm, producto => producto.estantes)
  @JoinTable({
    name: TABLE_NAMES.inn.pdt.stt.estanteProducto,
    joinColumn: {
      name: TABLE_NAMES.inn.pdt.stt.estantes,
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: TABLE_NAMES.inn.pdt.productos,
      referencedColumnName: 'id',
    },
  })
  productos: ProductoOrm[];
}
