import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { AccionEvidenciaLog, TipoEvidencia } from '@inn/operaciones/tanqueos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbastecimientoOrm } from './abastecimiento.orm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.tanqueo_evidencias_log })
export class TanqueoEvidenciaLogOrm extends BaseCreatedOrm {
  @ManyToOne(() => TanqueoOrm, { nullable: true })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo?: TanqueoOrm;

  @ManyToOne(() => AbastecimientoOrm, { nullable: true })
  @JoinColumn({ name: 'ABASTECIMIENTOOID' })
  abastecimiento?: AbastecimientoOrm;

  @Column({ name: 'TIPOEVIDENCIA', type: 'nvarchar', length: 50 })
  tipoEvidencia: TipoEvidencia;

  @Column({ name: 'ACCION', type: 'nvarchar', length: 12 })
  accion: AccionEvidenciaLog;

  @Column({ name: 'MEDIAANTERIOROID', type: 'int', nullable: true })
  mediaAnteriorId?: number;

  @Column({ name: 'MEDIANUEVOOID', type: 'int', nullable: true })
  mediaNuevoId?: number;

  @Column({ name: 'TIPODESTINO', type: 'nvarchar', length: 50, nullable: true })
  tipoDestino?: TipoEvidencia;

  @Column({ name: 'MOTIVO', type: 'nvarchar', length: 500, nullable: true })
  motivo?: string;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;
}
