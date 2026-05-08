import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENTERCER')
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC' })
  numDoc: string;

  @Column({ name: 'TERDIGITO' })
  digitoVerifiDoc: string;

  @Column({ name: 'TERPRINOM' })
  primerNombre: string;

  @Column({ name: 'TERSEGNOM' })
  segundoNombre: string;

  @Column({ name: 'TERPRIAPE' })
  primerApellido: string;

  @Column({ name: 'TERSEGAPE' })
  segundoApellido: string;
}
