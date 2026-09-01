import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENTERCERD')
export class DireccionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERDIRECCION' })
  direccion: string;
}
