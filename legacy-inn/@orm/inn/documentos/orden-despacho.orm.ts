import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AreaServicioOrm, DependenciaOrm, TerceroOrm, UsuarioOrm } from '@orm/gen';
import { EstadoEntregaOrdenDespachoCode, TIPOS_DOCUMENTO } from '@ctypes/inn/documentos';
import { DetalleOrdenDespachoOrm } from './orden-despacho.detalle.orm';
import { ComprobanteEntradaOrm, DocumentoOrm } from '@orm/inn/documentos';
import { TABLE_NAMES } from '@common/application/constants';
import { AlmacenOrm } from '../productos/almacen.orm';
import {
  EstadoProductoOrdenDespachoCode,
  TipoOrdenDespachoCode,
} from '@ctypes/inn/documentos/orden-despacho';
import { OrdenDespachoDocumentoOrm } from './orden-despacho.recordes.orm';
import {
  DestinoOrdenDespachoTypeCode,
  TipoOrdenDespachoTypeCode,
} from '@gtypes/inn/orden-despacho';

@Entity(TABLE_NAMES.inn.dcm.odp.ordenesDespacho)
export class OrdenDespachoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IODDESTORDEN' })
  destinoCode: DestinoOrdenDespachoTypeCode;

  tipo = TIPOS_DOCUMENTO.ORDEN_DESPACHO;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @OneToOne(() => OrdenDespachoDocumentoOrm, documento => documento.ordenDespacho)
  @JoinColumn([
    { name: TABLE_NAMES.inn.dcm.odp.relacionDocumento, referencedColumnName: 'documentoId' },
  ])
  documentoRelacionado: OrdenDespachoDocumentoOrm;

  @Column({ name: 'IODTIPOORDEN' })
  tipoOrdenCode: TipoOrdenDespachoCode;

  @Column({ name: 'IODESTPRO' })
  estadoProductosCode: EstadoProductoOrdenDespachoCode;

  @Column({ name: 'IODESTENTRE' })
  estadoEntregaCode: EstadoEntregaOrdenDespachoCode;

  @Column({ name: 'IODASOCIR' })
  isAsociadaCirugia: boolean;

  @Column({ name: 'IODAUTOMATICO' })
  isAutomatico: boolean;

  @Column({ name: 'IODIMPCOMENT' })
  importarComprobanteEntrada: boolean;

  @ManyToOne(() => ComprobanteEntradaOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.dcm.cet.comprobantesEntrada, referencedColumnName: 'id' }])
  comprobanteEntrada: ComprobanteEntradaOrm;

  @Column({ name: TABLE_NAMES.inn.dcm.cet.comprobantesEntrada })
  comprobanteEntradaId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.almacenes, referencedColumnName: 'id' }])
  almacenOrigen: AlmacenOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.almacenes })
  almacenOrigenId: number;

  @ManyToOne(() => AlmacenOrm)
  @JoinColumn([{ name: 'INNALMDES', referencedColumnName: 'id' }])
  almacenDestino: AlmacenOrm;

  @Column({ name: 'INNALMDES' })
  almacenDestinoId: number;

  @ManyToOne(() => AreaServicioOrm)
  @JoinColumn([{ name: 'INNAREADES', referencedColumnName: 'id' }])
  areaServicioDestino: AreaServicioOrm;

  @Column({ name: 'INNAREADES' })
  areaServicioDestinoId: number;

  @ManyToOne(() => DependenciaOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.dependencias, referencedColumnName: 'id' }])
  dependencia: DependenciaOrm;

  @Column({ name: TABLE_NAMES.gen.dependencias })
  dependenciaId: number;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.terceros, referencedColumnName: 'id' }])
  tercero: TerceroOrm;

  @Column({ name: TABLE_NAMES.gen.terceros })
  terceroId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  recibidoPor: UsuarioOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  recibidoPorId: number;

  @Column({ name: 'INNCONAJU' })
  concepto: number;

  @Column({ name: 'IODDESCRIP' })
  descripcion: string;

  @Column({ name: 'INNRECORDES' })
  reciboId: number;

  @OneToMany(() => DetalleOrdenDespachoOrm, detalle => detalle.ordenDespacho)
  detalle: DetalleOrdenDespachoOrm[];

  fechaCreacion: Date;
}
