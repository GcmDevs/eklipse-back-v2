import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('INNAGRUPAMI')
export class AgrupamientoProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'AGRCODIGO' })
  codigo: string;

  @Column({ name: 'AGRNOMBRE' })
  nombre: string;
}
