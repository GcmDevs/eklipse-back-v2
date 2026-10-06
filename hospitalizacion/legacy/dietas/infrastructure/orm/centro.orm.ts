import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CatalogOrm } from './catalog.orm';
import { ScheduleOrm } from './schedule.orm';

@Entity('ADNCENATE')
export class CentroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ACACODIGO' })
  codigo: string;

  @Column({ name: 'ACANOMBRE' })
  nombre: string;

  @OneToMany(() => CatalogOrm, catalog => catalog.client)
  catalogs: CatalogOrm[];

  @OneToMany(() => ScheduleOrm, schedule => schedule.client)
  schedules: ScheduleOrm[];
}
