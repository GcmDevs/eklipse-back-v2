import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { CodigoInconsistencia, SeveridadInconsistencia } from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoInconsistencia, ResultadoInconsistencia } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.tanqueo_incons })
export class TanqueoInconsistenciaOrm extends BaseOrm {
  @ManyToOne(() => TanqueoOrm, tanqueo => tanqueo.inconsistencias, { nullable: false })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo: TanqueoOrm;

  @Column({ name: 'CODIGO', enum: CodigoInconsistencia, type: 'nvarchar', length: 15 })
  codigo: CodigoInconsistencia;

  @Column({ name: 'CAMPO', type: 'nvarchar', length: 100, nullable: true })
  campo?: string;

  @Column({ name: 'SEVERIDAD', enum: SeveridadInconsistencia, type: 'nvarchar', length: 11 })
  severidad: SeveridadInconsistencia;

  @Column({ name: 'FECHADETECCION', type: 'datetime2' })
  fechaDeteccion: Date;

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 10, default: EstadoInconsistencia.ABIERTA })
  estado: EstadoInconsistencia;

  @Column({ name: 'RESULTADO', type: 'nvarchar', length: 20, nullable: true })
  resultado?: ResultadoInconsistencia;

  @ManyToOne(() => UsuarioOrm, { nullable: true })
  @JoinColumn({ name: 'RESUELTOPOROID' })
  resueltoPorUsuario?: UsuarioOrm;

  @Column({ name: 'FECHARESOLUCION', type: 'datetime2', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'CONTACTOREALIZADO', type: 'bit', default: false })
  contactoRealizado: boolean;

  @Column({ name: 'NOTACONTACTO', type: 'nvarchar', length: 500, nullable: true })
  notaContacto?: string;

  @Column({ name: 'NOTASRESOLUCION', type: 'text', nullable: true })
  notaResolucion?: string;
}
