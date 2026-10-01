import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('EKGENLASTAUTH')
export class LastAuthOldDbsOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENUSUARIO' })
  userId: number;

  @Column({ name: 'FROMWEB' })
  timesFromWeb: number;

  @Column({ name: 'FROMMOVIL' })
  timesFromMobile: number;

  @Column({ name: 'FECHLTAUTWEB' })
  lastAuthOnWeb: Date;

  @Column({ name: 'FECHLTAUTMOV' })
  lastAuthOnMobile: Date;
}
