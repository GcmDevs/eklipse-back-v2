import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CatalogOrm } from './catalog.orm';
import { removeTimeZone } from '@lgc/die/application/services';
import { CentroOrm } from './centro.orm';

@Entity('PDYDIEHORARIO')
export class ScheduleOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'int' })
  id: number;

  @ManyToOne(() => CentroOrm, client => client.schedules)
  @JoinColumn({ name: 'ADNCENATE' })
  client: CentroOrm;

  @Column({ name: 'ADNCENATE' })
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
    const daysToSubsFromStart = 86400000 * this.startDaysBeforeNow;
    const daysToSubsFromEnd = 86400000 * this.endDaysBeforeNow;
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
