import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { AlmacenOrm } from './almacen.orm';
import { CentroOrm } from '@inn/lgc/ctc/orm/adn';

@Entity(TABLE_NAMES.inn.pdt.centroAlmacen)
export class AlmacenCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: TABLE_NAMES.adn.centros, referencedColumnName: 'id' }])
  centro: CentroOrm;

  @Column({ name: TABLE_NAMES.adn.centros })
  centroId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.almacenes, referencedColumnName: 'id' }])
  almacen: AlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.almacenes })
  almacenId: number;
}
