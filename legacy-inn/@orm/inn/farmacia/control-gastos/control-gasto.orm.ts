import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { DetalleControlGastoOrm } from './control-gasto.detalle.orm';
import { EstadoControlGastoCode } from '@ctypes/inn/farmacia/control-gastos';
import { TABLE_NAMES } from '@common/application/constants';
import { IngresoOrm, UsuarioOrm } from '@orm/gen';
import { OrdenDespachoOrm, TrasladoProductoOrm } from '@orm/inn/documentos';
import { GcmContextType } from '@common/domain/types';
import { AreaCode } from '@farmacia/control-gastos/domain/types';
import { ControlGastoHistorialOrm } from './historial-control-gasto.orm';
import { CentroOrm } from '@orm/adn';

@Entity(TABLE_NAMES.inn.fmc.cgt.controlGastos)
export class ControlGastoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoControlGastoCode;

  @Column({ name: 'FECHACREAC' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAPROCE' })
  fechaProcedimiento: Date;

  @Column({ name: 'CTMAREA' })
  area: AreaCode;

  @ManyToOne(() => OrdenDespachoOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.dcm.odp.ordenesDespacho, referencedColumnName: 'id' }])
  ordenDespacho: OrdenDespachoOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.odp.ordenesDespacho })
  ordenDespachoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}1`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}1` })
  creadoPorId: number;

  @OneToMany(() => DetalleControlGastoOrm, detalle => detalle.controlGasto)
  detalle: DetalleControlGastoOrm[];

  @Column({ name: 'DOCUJUNTOLINK' })
  documentoAdjuntoLink: string;

  @Column({ name: 'DOCUJUNRECH' })
  isDocumentoRechazado: boolean;

  @Column({ name: 'HASVISTO' })
  hasVisto: boolean;

  @Column({ name: 'FACTURA1LINK' })
  factura1Link: string;

  @Column({ name: 'FACTURA2LINK' })
  factura2Link: string;

  @Column({ name: 'FACTURA3LINK' })
  factura3Link: string;

  @Column({ name: 'FECHAULTIFACT' })
  fechaUltimaFactura: Date;

  @Column({ name: 'OBSERVACIONRECHAZO' })
  obervacionRechazo: string;

  @Column({ name: 'INGRESO' })
  ingreso: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'SEDE', referencedColumnName: 'id' }])
  sede: CentroOrm;

  @Column({ name: 'SEDE' })
  sedeId: number;

  @OneToMany(() => IngresoOrm, ingreso => ingreso.consecutivo)
  paciente: IngresoOrm;

  @OneToMany(() => ControlGastoHistorialOrm, historial => historial.controlGasto)
  historial: ControlGastoHistorialOrm[];

  context: GcmContextType;

  @Column({ name: 'INNTRASPROD' })
  trasladoProductoId: number;

  @ManyToOne(() => TrasladoProductoOrm)
  @JoinColumn([{ name: 'INNTRASPROD', referencedColumnName: 'id' }])
  trasladoProducto: TrasladoProductoOrm;
}
