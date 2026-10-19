import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { ArchivoAlmacenadoOrm } from '@orm/cor';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CompraOrm } from '../adquisicion';
import { TipoDocCategoriaActivoOrm } from './tipo-doc-categoria-activo.orm';
import { TipoEquipoOrm } from './tipo-equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.tipo_eqp_docs })
export class DocumentoTipoEquipoOrm extends BaseTimestampedOrm {
  @ManyToOne(() => TipoEquipoOrm, tipo => tipo.documentos)
  @JoinColumn({ name: 'TIPOEQUIPOOID' })
  tipoEquipo: TipoEquipoOrm;

  @ManyToOne(() => TipoDocCategoriaActivoOrm, tdc => tdc.documentos)
  @JoinColumn({ name: 'TIPDOCUMENTOOID' })
  tipoDocumento: TipoDocCategoriaActivoOrm;

  @ManyToOne(() => CompraOrm, comp => comp.documentos, { nullable: true })
  @JoinColumn({ name: 'COMPRAOID' })
  compra?: CompraOrm;

  @Column({ name: 'APLICA', type: 'bit' })
  aplica: boolean;

  @Column({ name: 'OBSERVACIONES', type: 'varchar', length: 300, nullable: true })
  observaciones?: string;

  @ManyToOne(() => ArchivoAlmacenadoOrm, { nullable: true })
  @JoinColumn({ name: 'ARCHIVOID' })
  archivo?: ArchivoAlmacenadoOrm;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;
}
