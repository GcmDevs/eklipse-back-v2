import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENTERCER')
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC', length: 20 })
  numeroDocumento: string;

  @Column({ name: 'TERDIGITO', length: 1, nullable: true })
  digitoVerifiDocumento: string;

  @Column({ name: 'TERTIPDOC' })
  tipoDocumento: number;

  @Column({ name: 'TEREXPEDI', length: 60 })
  lugarExpediDocumento: string;

  @Column({ name: 'TERPRINOM', length: 200 })
  primerNombre: string;

  @Column({ name: 'TERSEGNOM', length: 30, nullable: true })
  segundoNombre: string;

  @Column({ name: 'TERPRIAPE', length: 30, nullable: true })
  primerApellido: string;

  @Column({ name: 'TERSEGAPE', length: 30, nullable: true })
  segundoApellido: string;
}
