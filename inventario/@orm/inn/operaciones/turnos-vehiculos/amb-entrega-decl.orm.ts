import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';
import { jsonColumnTransformer } from './json-column.transformer';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.entrega_decl })
@Unique('UQ_AMBENTREGADECL_ENTREGA_ROL', ['entregaId', 'rol'])
export class AmbEntregaDeclOrm extends BaseTimestampedOrm {
  @Column({ name: 'ENTREGAOID', type: 'int' })
  entregaId: number;

  @Column({ name: 'ROL', type: 'varchar', length: 10 })
  rol: string;

  @Column({ name: 'USUARIOOID', type: 'int' })
  usuarioId: number;

  @Column({ name: 'FECHAINICIO', type: 'datetime2' })
  fechaInicio: Date;

  @Column({ name: 'ESTADO', type: 'varchar', length: 12 })
  estado: string;

  @Column({ name: 'MODALIDAD', type: 'varchar', length: 15, nullable: true })
  modalidad?: string;

  @Column({ name: 'CAUSACIERRE', type: 'varchar', length: 20, nullable: true })
  causaCierre?: string;

  @Column({ name: 'LIMITEEDICION', type: 'datetime2', nullable: true })
  limiteEdicion?: Date;

  @Column({ name: 'FECHACIERRE', type: 'datetime2', nullable: true })
  fechaCierre?: Date;

  @Column({
    name: 'DATOS',
    type: 'nvarchar',
    length: 'MAX',
    transformer: jsonColumnTransformer<Record<string, unknown>>(),
  })
  datos: Record<string, unknown>;

  @Column({ name: 'EXTENDIDO', type: 'bit', default: false })
  extendido: boolean;
}
