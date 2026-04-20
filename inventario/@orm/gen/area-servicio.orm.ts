import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'GENARESER' })
export class AreaServicioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GASCODIGO' })
  codigo: string;

  @Column({ name: 'GASNOMBRE' })
  nombre: string;
}
