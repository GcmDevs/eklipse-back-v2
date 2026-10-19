import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENCONSEC')
export class ConsecutivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GCOCODIGO' })
  codigo: string;

  @Column({ name: 'GCONOMBRE' })
  nombre: string;

  @Column({ name: 'GCONUMERO' })
  numero: number;
}
