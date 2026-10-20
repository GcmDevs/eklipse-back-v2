import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { GrupoOrm } from './grupo.orm';

@Entity(TABLE_NAMES.inn.afn.productos)
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'APRCODIGO' })
  codigo: string;

  @Column({ name: 'APRNOMBRE' })
  descripcion: string;

  @Column({ name: TABLE_NAMES.inn.afn.grupos })
  grupoId: number;

  @ManyToOne(() => GrupoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.afn.grupos, referencedColumnName: 'id' }])
  grupo: GrupoOrm;

  @Column({ name: 'APRCOSPRO', type: 'decimal' })
  precioSugerido: number;

  nombre: string;
}
