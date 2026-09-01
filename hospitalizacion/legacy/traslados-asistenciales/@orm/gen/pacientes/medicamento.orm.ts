import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('INNPRODUC')
export class MedicamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IPRCODIGO' })
  codigo: string;

  @Column({ name: 'IPRDESCOR' })
  descripcionCorta: string;

  @Column({ name: 'IPRDESLAR' })
  descripcionLarga: string;

  descripcion: string;

  get originalColumnName() {
    return 'INNPRODUC';
  }
}
