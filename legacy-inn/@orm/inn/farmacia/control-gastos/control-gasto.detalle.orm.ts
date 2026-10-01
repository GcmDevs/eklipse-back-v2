import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DetalleOrdenDespachoOrm } from '@orm/inn/documentos';
import { TABLE_NAMES } from '@common/application/constants';
import { ControlGastoOrm } from './control-gasto.orm';

@Entity(TABLE_NAMES.inn.fmc.cgt.detalle)
export class DetalleControlGastoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ControlGastoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.fmc.cgt.controlGastos, referencedColumnName: 'id' }])
  controlGasto: ControlGastoOrm;

  @Column({ name: TABLE_NAMES.inn.fmc.cgt.controlGastos })
  controlGastoId: number;

  @ManyToOne(() => DetalleOrdenDespachoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.dcm.odp.detalle, referencedColumnName: 'id' }])
  item: DetalleOrdenDespachoOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.odp.detalle })
  itemId: number;

  @Column({ name: 'CONCILIADO' })
  isConciliado: boolean;
}
