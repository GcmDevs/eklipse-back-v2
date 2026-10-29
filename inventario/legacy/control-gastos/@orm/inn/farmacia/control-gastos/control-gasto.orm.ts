import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { DetalleControlGastoOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos/control-gasto.detalle.orm';
import { EstadoControlGastoCode } from '@inn/lgc/cgt/types/inn/farmacia/control-gastos/estado-control-gasto.type';
import { TABLE_NAMES } from '@common/application/constants';
import { IngresoOrm } from '@inn/lgc/cgt/orm/gen/ingreso.orm';
import { UsuarioOrm } from '@inn/lgc/cgt/orm/gen/usuario.orm';
import { DocumentoOrm } from '@inn/lgc/cgt/orm/inn/documentos/documento.orm';
import { OrdenDespachoOrm } from '@inn/lgc/cgt/orm/inn/documentos/orden-despacho.orm';
import { TrasladoProductoOrm } from '@inn/lgc/cgt/orm/inn/documentos/traslado-producto.orm';
import { GcmContextType } from '@common/domain/types';
import { AreaCode } from '@inn/lgc/cgt/types/inn/farmacia/control-gastos/area.type';
import { ControlGastoHistorialOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos/historial-control-gasto.orm';
import { CentroOrm } from '@inn/lgc/cgt/orm/adn/centro.orm';
import { ControlGastoArchivoOrm } from './archivo-control-gasto.orm';

@Entity(TABLE_NAMES.inn.fmc.cgt.controlGastos)
export class ControlGastoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'INNDOCUME', type: 'int', nullable: true })
  ordenRelacionadaId: number | null;

  @ManyToOne(() => DocumentoOrm, { nullable: true })
  @JoinColumn({ name: 'INNDOCUME', referencedColumnName: 'id' })
  ordenRelacionada: DocumentoOrm | null;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoControlGastoCode;

  @Column({ name: 'REQUIEREORDENESTRASLADO', type: 'bit', default: true })
  requiereOrdenesTraslado: boolean;

  @Column({ name: 'REQUIEREORDENESCOMPRASERVICIO', type: 'bit', default: true })
  requiereOrdenesCompraServicio: boolean;

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

  @OneToMany(() => ControlGastoArchivoOrm, archivo => archivo.controlGasto)
  archivos: ControlGastoArchivoOrm[];

  context: GcmContextType;

  @Column({ name: 'INNTRASPROD' })
  trasladoProductoId: number;

  @ManyToOne(() => TrasladoProductoOrm)
  @JoinColumn([{ name: 'INNTRASPROD', referencedColumnName: 'id' }])
  trasladoProducto: TrasladoProductoOrm;
}
