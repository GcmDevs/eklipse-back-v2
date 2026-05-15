import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKINNOFERPROVEEDOR')
export class ProveedorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TERNUMDOC' })
  terNumDoc: string;

  @Column({ name: 'NOMBRE_TERCERO' })
  nombreTercero: string;

  @Column({ name: 'ESTADO' })
  estado: number;

  @Column({ name: 'MAOS' })
  maos: boolean;
}
