import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'GCMHPNGESTIMOTTRASLADO' })
export class MotivoTrasladoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;
}
