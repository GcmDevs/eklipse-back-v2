import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TanqueoInconsistenciaOrm } from './tanqueo-inconsistencia.orm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.tanqueo_correcciones })
export class TanqueoCorreccionOrm extends BaseCreatedOrm {
  @ManyToOne(() => TanqueoOrm, { nullable: false })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo: TanqueoOrm;

  @Column({ name: 'CAMPO', type: 'nvarchar', length: 100 })
  campo: string;

  @Column({ name: 'VALORANTERIOR', type: 'nvarchar', length: 500, nullable: true })
  valorAnterior?: string;

  @Column({ name: 'VALORNUEVO', type: 'nvarchar', length: 500, nullable: true })
  valorNuevo?: string;

  @Column({ name: 'MOTIVO', type: 'nvarchar', length: 500 })
  motivo: string;

  @ManyToOne(() => TanqueoInconsistenciaOrm, { nullable: true })
  @JoinColumn({ name: 'INCONSISTENCIAOID' })
  inconsistencia?: TanqueoInconsistenciaOrm;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;
}
