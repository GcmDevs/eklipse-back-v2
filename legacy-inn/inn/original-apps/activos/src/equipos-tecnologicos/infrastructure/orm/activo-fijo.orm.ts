import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { ProductoOrm } from './producto.orm';
import { ResponsableOrm } from './responsable.orm';
import { AreaServicioOrm } from './area-servicio.orm';

@Entity('AFNACTIVO')
export class ActivoFijoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @OneToOne(() => ProductoOrm)
  @JoinColumn({ name: 'AFNPRODUC', referencedColumnName: 'id' })
  producto: ProductoOrm;

  @Column({ name: 'AFNPRODUC' })
  productoId: number;

  @Column({ name: 'AACNUMPLA' })
  numeroPlaca: string;

  @Column({ name: 'AFNAREAS' })
  areaId: number;

  @OneToOne(() => AreaServicioOrm)
  @JoinColumn({ name: 'AFNAREAS', referencedColumnName: 'id' })
  area: AreaServicioOrm;

  @Column({ name: 'AFNRESPON' })
  responsableId: number;

  @OneToOne(() => ResponsableOrm)
  @JoinColumn({ name: 'AFNRESPON', referencedColumnName: 'id' })
  responsable: ResponsableOrm;
}
