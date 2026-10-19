import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AlmacenProductoOrm } from './almacen.orm';
import { CentroOrm } from '@inn/orm/adn';

@Entity('EKINNALMACENATE')
export class AlmacenCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'ADNCENATE', referencedColumnName: 'id' }])
  centro: CentroOrm;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @ManyToOne(() => AlmacenProductoOrm)
  @JoinColumn([{ name: 'INNALMACE', referencedColumnName: 'id' }])
  almacen: AlmacenProductoOrm;

  @Column({ name: 'INNALMACE' })
  almacenId: number;
}
