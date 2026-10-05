import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { VersionFormatoFmtOrm } from '../version-formato.orm';
import { SeccionPlantillaFmtOrm } from './seccion.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.secciones.plantillas })
@Unique('UQ_EKFMTSECPLANTILLASFORMATOS_VERSIONFORMATO_SECCION', ['versionFormatoId', 'seccionId'])
export class SeccionVersionFormatoPlantillaOrm extends BaseOrm {
  @ManyToOne(() => VersionFormatoFmtOrm, verFmt => verFmt.secciones, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'VERSIONFORMATOOID' })
  versionFormato: VersionFormatoFmtOrm;

  @Column({ name: 'VERSIONFORMATOOID' })
  versionFormatoId: number;

  @ManyToOne(() => SeccionPlantillaFmtOrm, seccFormato => seccFormato.seccionesPlantilla, {
    nullable: false,
  })
  @JoinColumn({ name: 'SECCIONOID' })
  seccion: SeccionPlantillaFmtOrm | null;

  @Column({ name: 'SECCIONOID', nullable: false })
  seccionId: number | null;

  @Column({ type: 'int', name: 'ORDENMOSTRADO' })
  ordenMostrado: number;
}
