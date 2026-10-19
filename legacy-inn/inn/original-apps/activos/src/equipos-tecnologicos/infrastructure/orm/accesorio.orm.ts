import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { MantenimientoOrm } from './mantenimiento.orm';
import { IsNotEmpty } from 'class-validator';

@Entity('GCMINNACCE')
export class AccesorioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  @IsNotEmpty()
  nombre: string;

  @ManyToMany(() => MantenimientoOrm, usuario => usuario.accesorios)
  mantenimientos: MantenimientoOrm[];
}
