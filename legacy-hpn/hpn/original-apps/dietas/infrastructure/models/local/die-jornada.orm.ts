import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import {
  DieJorEstadoCode,
  DieJorEstadoType,
  JornadaCode,
  JornadaType,
  dieJorEstadoTypeFactory,
  jornadasDietaTypeFactory,
  jornadasDietaTypeFactoryByNameForHumans,
} from '@lgc/die/domain/types/local';
import { DieCentroOrm } from './die-centro.orm';
import { DieSubgrupoOrm } from './die-sub-grupo.orm';
import { ScheduleOrm } from '../diets';

@Entity('PDYDIEJOR')
export class DieJornadaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DIEFECJOR' })
  fecha: Date;

  @ManyToOne(() => ScheduleOrm)
  @JoinColumn([{ name: 'DIEHORARIO', referencedColumnName: 'id' }])
  horario: ScheduleOrm;

  @Column({ name: 'DIEHORARIO' })
  horarioId: number;

  @Column({ name: 'DIEESTADO' })
  estadoCode: DieJorEstadoCode;

  estado: DieJorEstadoType;

  jornadaCode: JornadaCode;
  jornada: JornadaType;

  @ManyToOne(() => DieCentroOrm, dieCentro => dieCentro.dieJornadas)
  @JoinColumn({ name: 'PDYDIECEN' })
  dieCentro: DieCentroOrm;

  @Column({ name: 'PDYDIECEN' })
  dieCentroId: number;

  @OneToMany(() => DieSubgrupoOrm, dieSubgrupos => dieSubgrupos.dieJornada)
  dieSubgrupos: DieSubgrupoOrm[];

  setTypes(removeTypeCodes?: boolean) {
    this.estado = dieJorEstadoTypeFactory(this.estadoCode);
    if (this.horario) {
      this.jornada = jornadasDietaTypeFactoryByNameForHumans(this.horario.name);
      this.jornadaCode = this.jornada.getCode();
    }

    if (removeTypeCodes) {
      delete this.estadoCode;
    }
  }
}
