import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('GENPACIEN')
export class PacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'PACPRINOM' })
  primerNombre: string;

  @Column({ name: 'PACSEGNOM' })
  segundoNombre: string;

  @Column({ name: 'PACPRIAPE' })
  primerApellido: string;

  @Column({ name: 'PACSEGAPE' })
  segundoApellido: string;

  @Column({ name: 'PACTIPDOC' })
  tipoDocumento: string;

  @Column({ name: 'PACNUMDOC' })
  documento: string;
}
