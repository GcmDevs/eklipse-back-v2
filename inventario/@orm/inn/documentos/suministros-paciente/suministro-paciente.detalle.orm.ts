import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductoOrm } from '../../productos/producto.orm';
import { SuministroPacienteOrm } from './suministro-paciente.orm';

@Entity('INNMSUMPA')
export class DetalleSuministroPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'INNCSUMPA' })
  suministroPacienteId: number;

  @ManyToOne(() => SuministroPacienteOrm, ordenDespacho => ordenDespacho.detalle)
  @JoinColumn({ name: 'INNCSUMPA' })
  suministroPaciente: SuministroPacienteOrm;

  @Column({ name: 'ISMCOSPRO' })
  precio: number;

  @Column({ name: 'IDDCANTID', scale: 4 })
  cantidad: number;

  @Column({ name: 'ISMCANREC', scale: 4 })
  cantidadRecibida: number;

  @Column({ name: 'ISMCANDEV', scale: 4 })
  cantidadDevuelta: number;

  @Column({ name: 'ISMCANPEN', scale: 4 })
  cantidadPendiente: number;

  @Column({ name: 'ISMCANAPL', scale: 4 })
  cantidadAplicada: number;
}
