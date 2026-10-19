import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { EstanteOrm } from './estantes';

@Entity(TABLE_NAMES.inn.pdt.almacenes)
export class AlmacenOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IALCODIGO' })
  codigo: string;

  @Column({ name: 'IALNOMBRE' })
  nombre: string;

  @Column({ name: 'IALPREFIJ' })
  prefijo: string;

  @OneToMany(() => EstanteOrm, estante => estante.almacen)
  estantes: EstanteOrm[];
}
