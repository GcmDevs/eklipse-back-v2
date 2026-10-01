import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { TipoAdquisicion } from '@equipos/domain/enums';
import { TerceroOrm } from '@orm/cor';
import { ProveedorOrm } from '@orm/gen';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { DocumentoTipoEquipoOrm } from '../catalogo';
import { EquipoOrm } from '../equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.adquisiciones })
@Unique('UQ_EKINNEQPADQUISICIONES_CODIGO', ['codigo'])
export class CompraOrm extends BaseTimestampedOrm {
  @Column({ name: 'CODIGO', type: 'varchar', length: 30 })
  codigo: string;

  @Column({ name: 'NUMFACTURA', type: 'nvarchar', length: 100, nullable: true })
  numFactura?: string;

  @Column({ name: 'FECHAFACTURA', type: 'date', nullable: true })
  fechaFactura?: Date;

  @Column({ name: 'FECHACOMPRA', type: 'date' })
  fechaCompra: Date;

  @Column({ name: 'FECHAFABRICACION', type: 'date', nullable: true })
  fechaFabricacion?: Date;

  @Column({ name: 'TIPOADQUISICION', type: 'varchar', length: 30 })
  tipoAdquisicion: TipoAdquisicion;

  @Column({ name: 'APLICAGARANTIA', type: 'bit', default: false })
  aplicaGarantia: boolean;

  @Column({ name: 'FECHVENCGARANTIA', type: 'date', nullable: true })
  fechVencGarantia?: Date;

  @ManyToOne(() => ProveedorOrm)
  @JoinColumn({ name: 'PROVEEDOROID' })
  proveedor: ProveedorOrm;

  @ManyToOne(() => TerceroOrm, { nullable: true })
  @JoinColumn({ name: 'FABRICANTEOID' })
  fabricante?: TerceroOrm;

  @ManyToOne(() => TerceroOrm, { nullable: true })
  @JoinColumn({ name: 'DISTRIBUIDOROID' })
  distribuidor?: TerceroOrm;

  @OneToMany(() => DocumentoTipoEquipoOrm, doc => doc.compra)
  documentos: DocumentoTipoEquipoOrm[];

  @Column({ name: 'PROVEEDORSNAP', type: 'nvarchar', length: 200 })
  proveedorSnap: string;

  @Column({ name: 'FABRICANTESNAP', type: 'nvarchar', length: 200, nullable: true })
  fabricanteSnap?: string;

  @Column({ name: 'DISTRIBUIDORSNAP', type: 'nvarchar', length: 200, nullable: true })
  distribuidorSnap?: string;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 600, nullable: true })
  observaciones?: string;

  @OneToMany(() => EquipoOrm, equipo => equipo.compra)
  equipos: EquipoOrm[];
}
