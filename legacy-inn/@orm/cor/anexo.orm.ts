import { TABLE_NAMES } from '@common/application/constants';
import { EntidadTipoAnexo } from '@common/domain/enums';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { ArchivoAlmacenadoOrm } from './archivo-almacenado.orm';

@Entity({ name: TABLE_NAMES.cor.anexos })
@Index('IDX_EKCORANEXOS_ENTIDAD', ['entidadTipo', 'entidadId'])
export class AnexoOrm extends BaseTimestampedOrm {
  @Column({ name: 'ENTIDADTIPO', type: 'nvarchar', length: 40, nullable: false })
  entidadTipo: EntidadTipoAnexo;

  @Column({ name: 'ENTIDADOID', type: 'int', nullable: false })
  entidadId: number;

  @Column({ name: 'ARCHIVOID', type: 'int', nullable: false })
  archivoId: number;

  @OneToOne(() => ArchivoAlmacenadoOrm, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ARCHIVOID' })
  archivo?: ArchivoAlmacenadoOrm;

  @Column({ name: 'NOMBRE', type: 'nvarchar', length: 30, nullable: true })
  nombre: string | null;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 300, nullable: true })
  observaciones: string | null;

  @Column({ name: 'ORDEN', type: 'smallint', default: 0 })
  orden: number;
}
