import { TABLE_NAMES } from '@common/application/constants';
import { UsuariosCreativos } from "@common/domain/enums";
import { BaseTimestampedOrm } from "@common/infrastructure/orm";
import { FormatoOrm } from "@orm/inn/equipos";
import { EstadoVersionFormato } from "apps/motor-formatos/domain/enums";
import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { SeccionAnexoImagenesOrm } from "./secciones/seccion-anex-imagen.orm";
import { RegistroDiligenciadoFmtOrm } from "./registro-diligenciado.orm";
import { SeccionVersionFormatoPlantillaOrm } from "./secciones";

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.versiones })
@Index('IDX_EKFMTVERSIONESFORMATOS_ESTADO', ['estado'])
@Index('IDX_EKFMTVERSIONESFORMATOS_FORMATO', ['formatoId'])
@Check('CHK_EKFMTVERSIONESFORMATOS_PUBLISHED_FIELDS', `
  (ESTADO <> ${EstadoVersionFormato.PUBLICADO}) OR
  (PUBLICADOPOROID IS NOT NULL AND FECHAPUBLICACION IS NOT NULL)
`)
export class VersionFormatoFmtOrm extends BaseTimestampedOrm {
  @ManyToOne(() => FormatoOrm, (fmt) => fmt.versiones, { nullable: false })
  @JoinColumn({ name: 'FORMATOOID' })
  formato: FormatoOrm;

  @Column({ name: 'FORMATOOID' })
  formatoId: number;

  @Column({ type: 'int', name: 'VERSION' })
  version: number;

  @Column({ type: 'varchar', length: 15, name: 'ETIQUETAVERSION', nullable: true })
  etiquetaVersion: string | null;

  @Column({ enum: EstadoVersionFormato, default: EstadoVersionFormato.BORRADOR, name: 'ESTADO' })
  estado: EstadoVersionFormato;

  @OneToMany(() => SeccionVersionFormatoPlantillaOrm, (secc) => secc.versionFormato, { cascade: true })
  secciones: SeccionVersionFormatoPlantillaOrm[];

  @ManyToOne(() => SeccionAnexoImagenesOrm)
  @JoinColumn({ name: 'CONFIGESTRUCSECIMAGENESOID' })
  configuracionSecImagenes: SeccionAnexoImagenesOrm;

  @Column({ name: 'CONFIGESTRUCSECIMAGENESOID' })
  configuracionSecImagenesId: number;

  @Column({ type: 'simple-json', default: '{}', name: 'SCHEMA' })
  schema: Record<string, unknown>;

  @Column({ name: 'PUBLICADOPOROID', nullable: true })
  publicadoPorId: number | null;

  @Column({ type: 'datetime2', name: 'FECHAPUBLICACION', nullable: true })
  fechaPublicacion: Date | null;

  @Column({ name: 'CREADOPOR' })
  creadoPor: UsuariosCreativos;

  @Column({ name: 'CREADORPOROID' })
  creadoPorId: number;

  @OneToMany(() => RegistroDiligenciadoFmtOrm, (reg) => reg.versionFormato)
  registros: RegistroDiligenciadoFmtOrm[];
}
