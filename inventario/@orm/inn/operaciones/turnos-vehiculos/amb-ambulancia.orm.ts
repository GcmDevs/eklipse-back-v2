import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.ambulancia })
@Unique('UQ_AMBAMBULANCIA_VEHICULOOID', ['vehiculoId'])
export class AmbAmbulanciaOrm extends BaseTimestampedOrm {
  @Column({ name: 'VEHICULOOID', type: 'int' })
  vehiculoId: number;

  @Column({ name: 'TIPOAMBULANCIA', type: 'varchar', length: 3 })
  tipoAmbulancia: string;

  @Column({ name: 'ESTADOSERV', type: 'varchar', length: 15, default: 'EN_SERVICIO' })
  estadoServicio: string;

  @Column({ name: 'REGISTRADOPOROID', type: 'int' })
  registradoPorId: number;
}
