import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { Column, Entity } from 'typeorm';
import { jsonColumnTransformer } from './json-column.transformer';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.evento })
export class AmbEventoOrm extends BaseCreatedOrm {
  @Column({ name: 'ENTIDAD', type: 'varchar', length: 25 })
  entidad: string;

  @Column({ name: 'ENTIDADOID', type: 'int' })
  entidadId: number;

  @Column({ name: 'TIPOEVENTO', type: 'varchar', length: 40 })
  tipoEvento: string;

  @Column({ name: 'USUARIOOID', type: 'int', nullable: true })
  usuarioId?: number;

  @Column({ name: 'MOTIVO', type: 'varchar', length: 500, nullable: true })
  motivo?: string;

  @Column({
    name: 'DETALLE',
    type: 'nvarchar',
    length: 'MAX',
    nullable: true,
    transformer: jsonColumnTransformer<Record<string, unknown>>(),
  })
  detalle?: Record<string, unknown>;
}
