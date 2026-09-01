import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'GCMHPNSERVDESTI' })
export class ServicioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DESCRIPCION' })
  nombre: string;
}
