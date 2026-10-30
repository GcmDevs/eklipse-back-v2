import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';
import { jsonColumnTransformer } from './json-column.transformer';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.dotacion })
@Unique('UQ_AMBDOTACION_VEHICULO_FECHA', ['vehiculoId', 'fecha'])
export class AmbDotacionOrm extends BaseTimestampedOrm {
  @Column({ name: 'VEHICULOOID', type: 'int' })
  vehiculoId: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'TIPOAMBULANCIA', type: 'varchar', length: 3 })
  tipoAmbulancia: string;

  @Column({ name: 'PLANTILLAOID', type: 'int' })
  plantillaId: number;

  @Column({ name: 'USUARIOOID', type: 'int' })
  usuarioId: number;

  @Column({ name: 'ESTADO', type: 'varchar', length: 15 })
  estado: string;

  @Column({ name: 'COMPLETA', type: 'bit', nullable: true })
  completa?: boolean;

  @Column({ name: 'BLOQUEADA', type: 'bit', default: false })
  bloqueada: boolean;

  @Column({ name: 'CIERREAUTOMATICO', type: 'bit', default: false })
  cierreAutomatico: boolean;

  @Column({ name: 'YAGUARDADA', type: 'bit', default: false })
  yaGuardada: boolean;

  @Column({ name: 'EXTENDIDO', type: 'bit', default: false })
  extendido: boolean;

  @Column({ name: 'FECHAINICIO', type: 'datetime2' })
  fechaInicio: Date;

  @Column({ name: 'FECHALIMITE', type: 'datetime2' })
  fechaLimite: Date;

  @Column({ name: 'FECHAULTIMOCIERRE', type: 'datetime2', nullable: true })
  fechaUltimoCierre?: Date;

  @Column({
    name: 'DATOBORRADOR',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: jsonColumnTransformer<Record<string, unknown>>(),
  })
  datoBorrador?: Record<string, unknown>;

  @Column({
    name: 'DATOCONFIRMADO',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: jsonColumnTransformer<Record<string, unknown>>(),
  })
  datoConfirmado?: Record<string, unknown>;
}
