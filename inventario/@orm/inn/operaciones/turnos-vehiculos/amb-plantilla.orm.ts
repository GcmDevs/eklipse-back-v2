import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';
import { jsonColumnTransformer } from './json-column.transformer';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.plantilla })
@Unique('UQ_AMBPLANTILLA_FORMATO_VERSION', ['formato', 'version'])
export class AmbPlantillaOrm extends BaseTimestampedOrm {
  @Column({ name: 'FORMATO', type: 'varchar', length: 20 })
  formato: string;

  @Column({ name: 'VERSION', type: 'int' })
  version: number;

  @Column({ name: 'VIGENTE', type: 'bit', default: false })
  vigente: boolean;

  @Column({
    name: 'ESTRUCTURA',
    type: 'nvarchar',
    length: 'MAX',
    transformer: jsonColumnTransformer<Record<string, unknown>>(),
  })
  estructura: Record<string, unknown>;

  @Column({ name: 'CREADOPOROID', type: 'int' })
  creadoPorId: number;
}
