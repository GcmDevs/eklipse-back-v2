import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';

@Entity({ name: TABLE_NAMES.gen.terceros, synchronize: false })
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC' })
  numeroDocumento: string;

  @Column({ name: 'TERDIGITO' })
  digitoVerifiDoc: string;

  @Column({ name: 'TERTIPDOC' })
  tipoDocumento: number;

  @Column({ name: 'TEREXPEDI' })
  lugarExpediDocumento: string;

  @Column({ name: 'TERPRINOM' })
  primerNombre: string;

  @Column({ name: 'TERSEGNOM' })
  segundoNombre: string;

  @Column({ name: 'TERPRIAPE' })
  primerApellido: string;

  @Column({ name: 'TERSEGAPE' })
  segundoApellido: string;

  @Column({ name: 'TERNOMCOM' })
  nombreCompleto: string;
}
