import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { RegistroActividadOrm } from '@orm/inn/equipos';
import { EstadoRegistroDilg } from 'apps/motor-formatos/domain';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { VersionFormatoFmtOrm } from './version-formato.orm';

export class RegistroImagenJsonOrm {
  key: string;
  archivoId: number;
}

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.registros_diligenciados })
@Index('IDX_EKFMTREGSDATOSDILIGENCIADOSMANT_VERSION', ['versionFormatoId'])
@Index('IDX_EKFMTREGSDATOSDILIGENCIADOSMANT_FORMATO', ['formatoId'])
@Index('IDX_EKFMTREGSDATOSDILIGENCIADOSMANT_EQUIPO', ['equipoId'])
@Index('IDX_EKFMTREGSDATOSDILIGENCIADOSMANT_ESTADO', ['estado'])
export class RegistroDiligenciadoFmtOrm extends BaseTimestampedOrm {
  @ManyToOne(() => VersionFormatoFmtOrm, v => v.registros, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'VERSIONFORMATOOID' })
  versionFormato: VersionFormatoFmtOrm;

  @Column({ name: 'VERSIONFORMATOOID' })
  versionFormatoId: number;

  @Column({ name: 'FORMATOOID' })
  formatoId: number;

  @Column({ name: 'EQUIPOOID' })
  equipoId: number;

  @ManyToOne(() => RegistroActividadOrm, { nullable: true })
  @JoinColumn({ name: 'REGACTIVIDADOID' })
  registroActividad: RegistroActividadOrm;

  @Column({ name: 'REGACTIVIDADOID', type: 'int', nullable: true })
  registroActividadId?: number;

  @Column({ type: 'simple-json', default: '{}', name: 'DATOSNAPSHOT' })
  datoSnapshot: Record<string, unknown>;

  @Column({ type: 'simple-json', name: 'IMAGENES', nullable: true })
  imagenes: RegistroImagenJsonOrm[];

  @Column({
    name: 'ESTADO',
    type: 'nvarchar',
    length: 20,
    default: EstadoRegistroDilg.BORRADOR,
  })
  estado: EstadoRegistroDilg;

  @Column({ name: 'DILIGPOROID' })
  diligenciadoPorId: number;

  @Column({ type: 'datetime2', name: 'FECHENVIO', nullable: true })
  fechaEnvio: Date | null;

  @Column({ type: 'datetime2', name: 'FECHCOMPLETADO', nullable: true })
  fechaCompletado: Date | null;
}
