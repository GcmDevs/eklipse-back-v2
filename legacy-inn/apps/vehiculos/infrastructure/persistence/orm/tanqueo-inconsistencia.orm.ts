import { BaseOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { CodigoInconsistencia, SeveridadInconsistencia } from '@vehiculos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: 'GCNTANQUEOINCONS' })
export class TanqueoInconsistenciaOrm extends BaseOrm {
  @ManyToOne(() => TanqueoOrm, tanqueo => tanqueo.inconsistencias, { nullable: false })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo: TanqueoOrm;

  @Column({ name: 'CODIGO', enum: CodigoInconsistencia, type: 'nvarchar', length: 20 })
  codigo: CodigoInconsistencia;

  @Column({ name: 'CAMPO', type: 'nvarchar', length: 100, nullable: true })
  campo?: string;

  @Column({ name: 'SEVERIDAD', enum: SeveridadInconsistencia, type: 'nvarchar', length: 20 })
  severidad: SeveridadInconsistencia;

  @Column({ name: 'FECHADETECCION', type: 'datetime2' })
  fechaDeteccion: Date;

  @ManyToOne(() => UsuarioOrm, { nullable: true })
  @JoinColumn({ name: 'RESUELTOPOROID' })
  resueltoPorUsuario?: UsuarioOrm;

  @Column({ name: 'FECHARESOLUCION', type: 'datetime2', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'CONTACTOREALIZADO', type: 'bit', default: false })
  contactoRealizado: boolean;

  @Column({ name: 'NOTACONTACTO', type: 'nvarchar', length: 500, nullable: true })
  notaContacto?: string;

  @Column({ name: 'NOTASRESOLUCION', type: 'nvarchar', length: 'MAX', nullable: true })
  notaResolucion?: string;
}
