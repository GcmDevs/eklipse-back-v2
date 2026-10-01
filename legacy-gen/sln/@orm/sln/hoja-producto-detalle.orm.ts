import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { HojaProductoOrm } from './hoja-producto.orm';
import { HojaServicioOrm } from './hoja-servicio.orm';

@Entity('SLNSERPRO')
export class DetalleHojaProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => HojaProductoOrm, hojaServicio => hojaServicio.detalle)
  @JoinColumn({ name: 'SLNORDSER1' })
  hojaServicio: HojaProductoOrm;

  @OneToOne(() => HojaServicioOrm)
  @JoinColumn({ name: 'OID' })
  servicio: HojaServicioOrm;

  @Column({ name: 'SERDESSER' })
  descripcion: string;

  @Column({ name: 'SERCANTID', scale: 4 })
  cantidad: number;

  @Column({ name: 'SERVALPRO', scale: 4 })
  valorProducto: number;

  @Column({ name: 'SERVALENT', scale: 4 })
  valorEntidad: number;

  @Column({ name: 'SERVALPAC', scale: 4 })
  valorPaciente: number;
}
