import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { ProductoOrm } from '../productos/producto.orm';
import { LoteProductoOrm } from '../productos/lote.orm';
import { SuministroPacienteOrm } from './suministro-paciente.orm';

@Entity(TABLE_NAMES.inn.dcm.smp.detalle)
export class DetalleSuministroPacienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.productos, referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.productos })
  productoId: number;

  @ManyToOne(() => SuministroPacienteOrm, ordenDespacho => ordenDespacho.detalle)
  @JoinColumn({ name: TABLE_NAMES.inn.dcm.smp.suministroPaciente })
  suministroPaciente: SuministroPacienteOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.smp.suministroPaciente })
  suministroPacienteId: number;

  @ManyToOne(() => LoteProductoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.lotes, referencedColumnName: 'id' }])
  lote: LoteProductoOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.lotes })
  loteId: number;

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
