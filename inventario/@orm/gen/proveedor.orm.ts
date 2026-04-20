import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity({ name: 'GENTERCERP' })
export class ProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GPRCODIGO' })
  codigo: string;

  @Column({ name: 'GPRNOMBRE' })
  nombre: string;

  @Column({ name: 'GENTERCER' })
  terceroId: number;

  @OneToOne(() => TerceroOrm)
  @JoinColumn({ name: 'GENTERCER', referencedColumnName: 'id' })
  tercero: TerceroOrm;

  @Column({ name: 'GPRDIRECC' })
  direccion: string;

  @Column({ name: 'GPRTELEFO1' })
  tel1: string;

  @Column({ name: 'GPRTELEFO2' })
  tel2: string;
}
