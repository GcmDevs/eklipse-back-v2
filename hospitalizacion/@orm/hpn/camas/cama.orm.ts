import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { ClasificacionCamaCode, EstadoCamaCode, MotivoBloqueoCode } from '@ctypes/hpn/camas';
import { IngresoOrm } from '@orm/adn/ingreso.orm';
import { SubgrupoOrm } from './subgrupo.orm';
import { TipoCamaOrm } from './tipo.orm';
import { GrupoOrm } from './grupo.orm';
import { CentroOrm } from '@orm/adn';

@Entity('HPNDEFCAM')
export class CamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCACODIGO' })
  codigo: string;

  @Column({ name: 'HCANOMBRE' })
  nombre: string;

  @Column({ name: 'HCAESTADO' })
  estadoCode: EstadoCamaCode;

  @Column({ name: 'HCAOBSHOS' })
  clasificacionCode: ClasificacionCamaCode;

  @Column({ name: 'HCABLOPOR' })
  motivoBloqueoCode: MotivoBloqueoCode;

  @Column({ name: 'ADNCENATE' })
  centroId: string;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: 'ADNCENATE', referencedColumnName: 'id' })
  centro: CentroOrm;

  @Column({ name: 'HPNTIPOCA' })
  tipoId: string;

  @ManyToOne(() => TipoCamaOrm)
  @JoinColumn({ name: 'HPNTIPOCA', referencedColumnName: 'id' })
  tipo: TipoCamaOrm;

  @Column({ name: 'HPNGRUPOS' })
  grupoId: number;

  @ManyToOne(() => GrupoOrm)
  @JoinColumn({ name: 'HPNGRUPOS', referencedColumnName: 'id' })
  grupo: GrupoOrm;

  @Column({ name: 'HPNSUBGRU' })
  subGrupoId: number;

  @ManyToOne(() => SubgrupoOrm)
  @JoinColumn({ name: 'HPNSUBGRU', referencedColumnName: 'id' })
  subgrupo: SubgrupoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;
}
