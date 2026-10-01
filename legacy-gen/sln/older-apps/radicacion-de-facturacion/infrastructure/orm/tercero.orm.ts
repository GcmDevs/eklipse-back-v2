import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('GENTERCER')
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC' })
  documento: number;

  @Column({ name: 'TERNOMCOM' })
  nombre: string;

  get originalColumnName() {
    return 'GENTERCER';
  }
}
