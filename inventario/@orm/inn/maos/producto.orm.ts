import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LineaOrm } from './set-linea.orm';
import { ClasificacionOrm } from './set-clasificacion.orm';
import { SetOrm } from './set.orm';

@Entity('INNMOSPRODUC')
export class ProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'CANTIDAD' })
  cantidad: number;

  @Column({ name: 'INNMOSETLINEA' })
  lineaId: number;

  @ManyToOne(() => LineaOrm, linea => linea.productos)
  @JoinColumn({ name: 'INNMOSETLINEA' })
  linea: LineaOrm;

  @Column({ name: 'INNMOSETCLASIFI' })
  clasificacionId: number;

  @ManyToOne(() => ClasificacionOrm, clasifi => clasifi.productos)
  @JoinColumn({ name: 'INNMOSETCLASIFI' })
  clasificacion: ClasificacionOrm;

  @Column({ name: 'INNMOSET' })
  setId: number;

  @ManyToOne(() => SetOrm, set => set.productos)
  @JoinColumn({ name: 'INNMOSET' })
  set: SetOrm;
}
