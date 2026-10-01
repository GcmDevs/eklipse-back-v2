import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENESTRATO')
export class EstratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GETCODIGO' })
  codigo: string;

  @Column({ name: 'GETNOMEST' })
  nombre: string;
}
