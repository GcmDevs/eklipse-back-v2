import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

@Entity('GENTERCERP')
export class ProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GPRCODIGO', length: 15 })
  codigo: string;

  @Column({ name: 'GPRNOMBRE', length: 200 })
  nombre: string;

  @Column({ name: 'GPRDIRECC' })
  direccion: string;

  @Column({ name: 'GPRTELEFO1' })
  tel1?: string;

  @Column({ name: 'GPRTELEFO2' })
  tel2?: string;

  @OneToOne(() => TerceroOrm)
  @JoinColumn({ name: 'GENTERCER', referencedColumnName: 'id' })
  tercero: TerceroOrm;
}
