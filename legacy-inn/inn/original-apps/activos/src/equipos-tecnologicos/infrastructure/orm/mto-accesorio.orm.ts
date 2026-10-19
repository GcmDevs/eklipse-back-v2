import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MantenimientoOrm } from './mantenimiento.orm';
import { AccesorioOrm } from './accesorio.orm';

@Entity('GCMINNHISTMANTACCE')
export class MtoAccesorioOrm {
  @PrimaryColumn({ name: 'HISTMANT' })
  mantenimientoId: number;

  @ManyToOne(() => MantenimientoOrm, mto => mto.accesorios)
  @JoinColumn({ name: 'HISTMANT' })
  mantenimiento: MantenimientoOrm;

  @PrimaryColumn({ name: 'ACCESORIO' })
  accesorioId: number;

  @ManyToOne(() => AccesorioOrm, Accesorio => Accesorio.mantenimientos)
  @JoinColumn({ name: 'ACCESORIO' })
  accesorio: AccesorioOrm;
}
