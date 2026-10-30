import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.elemento_venc })
@Unique('UQ_AMBELEMENTOVENC_VEH_ITEM', ['vehiculoId', 'itemKey'])
export class AmbElementoVencOrm extends BaseTimestampedOrm {
  @Column({ name: 'VEHICULOOID', type: 'int' })
  vehiculoId: number;

  @Column({ name: 'ITEMKEY', type: 'varchar', length: 60 })
  itemKey: string;

  @Column({ name: 'FECHAVENCIMIENTO', type: 'date' })
  fechaVencimiento: string;

  @Column({ name: 'ACTUALIZADOPOROID', type: 'int' })
  actualizadoPorId: number;
}
