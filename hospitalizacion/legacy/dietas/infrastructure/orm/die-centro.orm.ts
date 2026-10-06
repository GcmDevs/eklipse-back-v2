import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { DieJornadaOrm } from './die-jornada.orm';
import { CentroOrm } from './centro.orm';

@Entity('PDYDIECEN')
export class DieCentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'ADNCENATE', referencedColumnName: 'id' }])
  centro: CentroOrm;

  @Column({ name: 'ADNCENATE' })
  centroId: number;

  @Column({ name: 'DIEJORDES' })
  jornadaDesayunoId: number;

  @Column({ name: 'DIEJORALM' })
  jornadaAlmuerzoId: number;

  @Column({ name: 'DIEJORCEN' })
  jornadaCenaId: number;

  @Column({ name: 'DIEFECJOR' })
  fecha: Date;

  @OneToMany(() => DieJornadaOrm, jornada => jornada.dieCentro)
  dieJornadas: DieJornadaOrm[];
}
