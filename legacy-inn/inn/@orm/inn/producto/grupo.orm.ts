import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('INNGRUPO')
export class GrupoProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IGRCODIGO' })
  codigo: string;

  @Column({ name: 'IGRNOMBRE' })
  nombre: string;
}
