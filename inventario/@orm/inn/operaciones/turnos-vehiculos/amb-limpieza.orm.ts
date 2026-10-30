import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity } from 'typeorm';
import { jsonColumnTransformer } from './json-column.transformer';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.limpieza })
export class AmbLimpiezaOrm extends BaseTimestampedOrm {
  @Column({ name: 'TURNOOID', type: 'int' })
  turnoId: number;

  @Column({ name: 'VEHICULOOID', type: 'int' })
  vehiculoId: number;

  @Column({ name: 'PLANTILLAOID', type: 'int' })
  plantillaId: number;

  @Column({ name: 'USUARIOOID', type: 'int' })
  usuarioId: number;

  @Column({ name: 'ESTADO', type: 'varchar', length: 15 })
  estado: string;

  @Column({ name: 'CAUSACIERRE', type: 'varchar', length: 15, nullable: true })
  causaCierre?: string;

  @Column({ name: 'REPROCESO', type: 'bit', nullable: true })
  reproceso?: boolean;

  @Column({ name: 'TOTALNC', type: 'int', default: 0 })
  totalNc: number;

  @Column({
    name: 'DATOS',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: jsonColumnTransformer<Record<string, unknown>>(),
  })
  datos?: Record<string, unknown>;

  @Column({ name: 'FECHAFINALIZACION', type: 'datetime2', nullable: true })
  fechaFinalizacion?: Date;
}
