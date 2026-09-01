import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('HCNINDMED')
export class IndicacionesMedicasOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCIDETIND' })
  indicacion: string;

  get originalColumnName() {
    return 'HCNINDMED';
  }
}
