import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENTERCERP')
export class InnProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GPRCODIGO' })
  codigo: string;

  @Column({ name: 'GPRNOMBRE' })
  nombre: string;

  @Column({ name: 'GPRDIRECC' })
  direccion: string;

  @Column({ name: 'GPRTELEFO1' })
  tel1?: string;

  @Column({ name: 'GPRTELEFO2' })
  tel2?: string;

  centroId?: number;
}
