import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CatalogOrm, ScheduleOrm } from '../diets';

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
