import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENSERIPS')
export class ServicioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SIPCODIGO' })
  codigo: string;

  @Column({ name: 'SIPNOMBRE' })
  nombre: string;
}
