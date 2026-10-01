import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import {
  DestinoOrdenDespachoType,
  DestinoOrdenDespachoTypeCode,
  EstadoDevolucionProductosTypeCode,
  EstadoEntregaOrdenDespachoType,
  EstadoEntregaOrdenDespachoTypeCode,
  TipoOrdenDespachoType,
  TipoOrdenDespachoTypeCode,
} from './types';
import { DetalleOrdenDespachoOrm } from './detalle.orm';
import { UsuarioOrm } from '@crn/old/orm/dim/general';
import { AlmacenOrm } from '../almacen.orm';

@Entity('INNORDDESC')
export class OrdenDespachoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IODTIPOORDEN' })
  tipo: TipoOrdenDespachoTypeCode;

  @Column({ name: 'IODDESTORDEN' })
  destino: DestinoOrdenDespachoTypeCode;

  @Column({ name: 'INNALMACE' })
  almacenOrigenId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: 'INNALMACE', referencedColumnName: 'id' }])
  almacenOrigen: AlmacenOrm;

  @Column({ name: 'INNALMDES' })
  almacenDestinoId: number;

  @Column({ name: 'INNAREADES' })
  areaServicioDestinoId: number;

  @Column({ name: 'GENDEPEND' })
  dependenciaDestinoId: number;

  @Column({ name: 'INNCONAJU' })
  conceptoId: number;

  @Column({ name: 'GENTERCER' })
  terceroId: number;

  @Column({ name: 'IODDESCRIP' })
  descripcion: string;

  @Column({ name: 'IODESTPRO' })
  estadoDevolucion: EstadoDevolucionProductosTypeCode;

  /** ORDEN DE DESPACHO ASOCIADA A PROGRAMACION DE CIRUGIA */
  @Column({ name: 'IODASOCIR' })
  asociadaCirugia: boolean;

  /** OBTIENE O ESTABLE EL INDICADOR DE ORDEN DE DESPACHO GENERADA AUTOMÁTICAMENTE. */
  @Column({ name: 'IODAUTOMATICO' })
  automatico: boolean;

  /** OBTIENE O ESTABLE EL INDICADOR DE IMPORTACIÓN DE COMPROBANTE DE ENTRADA */
  @Column({ name: 'IODIMPCOMENT' })
  impComprobanteEntrada: boolean;

  @Column({ name: 'INNCCOMPR' })
  comprobanteId: number;

  @Column({ name: 'IODESTENTRE' })
  estadoEntrega: EstadoEntregaOrdenDespachoTypeCode;

  @Column({ name: 'INNRECORDES' })
  reciboId: number;

  @OneToMany(() => DetalleOrdenDespachoOrm, item => item.ordenDespacho)
  items: DetalleOrdenDespachoOrm[];

  /* Types */
  tipoForHumans?: TipoOrdenDespachoType;
  destinoForHumans?: DestinoOrdenDespachoType;
  estadoEntregaForHumans?: EstadoEntregaOrdenDespachoType;
  createdBy?: UsuarioOrm;
  createdAt?: Date;
  consecutivo?: string;
}
