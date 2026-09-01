import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENMEDICO')
export class MedicoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GMECODIGO' })
  codigo: string;

  @Column({ name: 'GMENOMCOM' })
  nombre: string;

  get originalColumnName() {
    return 'GENMEDICO';
  }
}
