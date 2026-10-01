import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACNUMDOC' })
  documento: string;

  @Column({ name: 'GPANOMCOM' })
  nombreCompleto: string;

  @Column({ name: 'GPAFECNAC' })
  fechaNacimiento: Date;

  get originalColumnName() {
    return 'GENPACIEN';
  }
}
