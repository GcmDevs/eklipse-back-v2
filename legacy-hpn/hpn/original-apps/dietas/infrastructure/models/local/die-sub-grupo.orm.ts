import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { DieJornadaOrm } from './die-jornada.orm';
import { DieEstadoOrm } from './die-estado.orm';
import { SubgrupoOrm } from './subgrupo.orm';

@Entity('PDYDIEGRU')
export class DieSubgrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => SubgrupoOrm)
  @JoinColumn([{ name: 'HPNSUBGRU', referencedColumnName: 'id' }])
  subgrupo: SubgrupoOrm;

  @Column({ name: 'HPNSUBGRU' })
  subGrupoId: number;

  @Column({ name: 'GENUSUREG' })
  creadoPorId: number;

  @CreateDateColumn({ name: 'FECHORREG' })
  fecha: Date;

  @ManyToOne(() => DieJornadaOrm, dieJornada => dieJornada.dieSubgrupos)
  @JoinColumn({ name: 'PDYDIEJOR' })
  dieJornada: DieJornadaOrm;

  @Column({ name: 'PDYDIEJOR' })
  dieJornadaId: number;

  @OneToMany(() => DieEstadoOrm, dietas => dietas.dieSubgrupo)
  dietas: DieEstadoOrm[];
}
