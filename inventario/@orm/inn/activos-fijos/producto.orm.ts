import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TIPOS } from '@inn/types/inn/central-compras/solicitudes';
import { GrupoOrm } from './grupo.orm';

@Entity('AFNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'APRCODIGO' })
  codigo: string;

  @Column({ name: 'APRNOMBRE' })
  descripcion: string;

  @Column({ name: 'AFNGRUPOS' })
  grupoId: number;

  @ManyToOne(() => GrupoOrm)
  @JoinColumn([{ name: 'AFNGRUPOS', referencedColumnName: 'id' }])
  grupo: GrupoOrm;

  @Column({ name: 'APRCOSPRO', type: 'decimal' })
  precioSugerido: number;

  clase = TIPOS.ACTIVO_FIJO;
}
