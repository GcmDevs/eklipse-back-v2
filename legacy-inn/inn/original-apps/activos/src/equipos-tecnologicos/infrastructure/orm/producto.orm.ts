import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { GrupoOrm } from './grupo.orm';

@Entity('AFNPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'APRCODIGO', length: 20 })
  codigo: string;

  @Column({ name: 'APRNOMBRE' })
  nombre: string;

  @Column({ name: 'AFNGRUPOS' })
  grupoId: number;

  @OneToOne(() => GrupoOrm)
  @JoinColumn({ name: 'AFNGRUPOS', referencedColumnName: 'id' })
  grupo: GrupoOrm;
}
