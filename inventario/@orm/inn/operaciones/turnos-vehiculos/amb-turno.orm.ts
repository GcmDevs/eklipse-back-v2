import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.turno })
export class AmbTurnoOrm extends BaseTimestampedOrm {
  @Column({ name: 'VEHICULOOID', type: 'int' })
  vehiculoId: number;

  @Column({ name: 'RESPONSABLEOID', type: 'int' })
  responsableId: number;

  @Column({ name: 'FECHAINICIO', type: 'datetime2' })
  fechaInicio: Date;

  @Column({ name: 'FECHAFIN', type: 'datetime2', nullable: true })
  fechaFin?: Date;

  @Column({ name: 'ESTADO', type: 'varchar', length: 15 })
  estado: string;

  @Column({ name: 'ORIGEN', type: 'varchar', length: 25 })
  origen: string;

  @Column({ name: 'CAUSACIERRE', type: 'varchar', length: 30, nullable: true })
  causaCierre?: string;
}
