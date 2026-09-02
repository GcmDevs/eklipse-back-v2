import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { DepartamentoOrm } from './departamento.orm';
import { ZonaCode } from '@hpn/lgc/aud/types/gen';

@Entity('GENMUNICI')
export class MunicipioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'MUNCODMUN', length: 3 })
  codigo: string;

  @Column({ name: 'MUNCODDEMU', length: 5 })
  codMunDep: string;

  @Column({ name: 'MUNNOMMUN', length: 40 })
  nombre: string;

  @Column({ name: 'MUNURBRUR' })
  zona: ZonaCode;

  @ManyToOne(() => DepartamentoOrm, departamento => departamento.municipios)
  @JoinColumn({ name: 'GENDEPTO' })
  departamento: DepartamentoOrm;

  @Column({ name: 'GENDEPTO' })
  codDepto: string;
}
