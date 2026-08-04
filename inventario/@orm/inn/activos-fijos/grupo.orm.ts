import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('AFNGRUPOS')
export class GrupoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GRUCODIGO' })
  codigo: string;

  @Column({ name: 'GRUNOMBRE' })
  nombre: string;
}
