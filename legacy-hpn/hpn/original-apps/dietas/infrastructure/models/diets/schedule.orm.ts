import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { DIE_ENT_NAMES } from './_entity-names';
import { DAY_IN_MS } from '@lgc/die/application/constants';
import { CatalogOrm } from './catalog.orm';
import { CentroOrm } from '../local';
import { removeTimeZone } from '@common/application/services';

@Entity(DIE_ENT_NAMES.schedule)
export class ScheduleOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'int' })
  id: number;

  @ManyToOne(() => CentroOrm, client => client.schedules)
  @JoinColumn({ name: DIE_ENT_NAMES.client })
  client: CentroOrm;

  @Column({ name: DIE_ENT_NAMES.client })
  clientId: number;

  @Column({ name: 'JORNOMBRE', length: 15 })
  name: string;

  @Column({ name: 'HORAINICIO', type: 'smallint', nullable: true })
  startTimeInMinutes: number;

  @Column({ name: 'DIPREVINI', default: 0, type: 'smallint' })
  startDaysBeforeNow: number;

  @Column({ name: 'HORAFINAL', type: 'smallint', nullable: true })
  endTimeInMinutes: number;

  @Column({ name: 'DIPREVFIN', default: 0, type: 'smallint' })
  endDaysBeforeNow: number;

  @Column({ name: 'ACTIVO' })
  isActive: boolean;

  @OneToMany(() => CatalogOrm, catalog => catalog.schedule)
  catalogs: CatalogOrm[];

  startTime: Date;
  endTime: Date;

  public timeInMinutesToDate(): void {
    const daysToSubsFromStart = DAY_IN_MS * this.startDaysBeforeNow;
    const daysToSubsFromEnd = DAY_IN_MS * this.endDaysBeforeNow;
    const dateInTime = new Date().getTime();

    this.startTime = removeTimeZone(
      new Date(
        new Date(
          `${new Date(dateInTime - daysToSubsFromStart).toISOString().split('T')[0]}:00:00`
        ).getTime() +
          this.startTimeInMinutes * 60000
      )
    );

    this.endTime = removeTimeZone(
      new Date(
        new Date(
          `${new Date(dateInTime - daysToSubsFromEnd).toISOString().split('T')[0]}:00:00`
        ).getTime() +
          this.endTimeInMinutes * 60000
      )
    );
  }
}
