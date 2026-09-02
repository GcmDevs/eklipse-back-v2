import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENPAISES')
export class PaisOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GPACODIGO' })
  codigo: string;

  @Column({ name: 'GPANOMBRE' })
  nombre: string;
}
