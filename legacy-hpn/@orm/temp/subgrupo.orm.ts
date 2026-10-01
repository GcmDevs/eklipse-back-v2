import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { GrupoOrm } from './grupo.orm';

@Entity('HPNSUBGRU')
export class SubgrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HSUCODIGO' })
  codigo: string;

  @Column({ name: 'HSUNOMBRE' })
  nombre: string;

  @Column({ name: 'GENARESER' })
  areaServicioId: number;

  @OneToMany(() => CamaOrm, camas => camas.subgrupo)
  camas: CamaOrm[];

  grupo: GrupoOrm;
  nombreGrupo: string;
}
