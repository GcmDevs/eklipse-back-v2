import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SetClasificacionOrm } from './clasificacion.orm';
import { SetLineaOrm } from './linea.orm';
import { SetOrm } from './set.orm';

@Entity('INNMOSPRODUC')
export class SetProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CODIGO', length: 100 })
  codigo: string;

  @Column({ name: 'NOMBRE', length: 500 })
  nombre: string;

  @Column({ name: 'CANTIDAD' })
  cantidad: number;

  @Column({ name: 'INNMOSET' })
  setId: number;

  @ManyToOne(() => SetOrm, set => set.productos)
  @JoinColumn({ name: 'INNMOSET' })
  set: SetOrm;

  @Column({ name: 'INNMOSETLINEA' })
  lineaId: number;

  @ManyToOne(() => SetLineaOrm, linea => linea.productos)
  @JoinColumn({ name: 'INNMOSETLINEA' })
  linea: SetLineaOrm;

  @Column({ name: 'INNMOSETCLASIFI' })
  clasificacionId: number;

  @ManyToOne(() => SetClasificacionOrm, clasificacion => clasificacion.productos)
  @JoinColumn({ name: 'INNMOSETCLASIFI' })
  clasificacion: SetClasificacionOrm;

  precioUnitario = 0;
  precioTotal = 0;
}
