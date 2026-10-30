import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { TipoEventoTanqueoLog } from '@inn/operaciones/tanqueos/domain/enums';
import { Column, Entity } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.tanqueo_eventos_log })
export class TanqueoEventoLogOrm extends BaseCreatedOrm {
  @Column({ name: 'TIPOEVENTO', type: 'nvarchar', length: 40 })
  tipoEvento: TipoEventoTanqueoLog;

  @Column({ name: 'ACTIVOOID', type: 'int', nullable: true })
  activoId?: number;

  @Column({ name: 'CANTIDAD', type: 'int', nullable: true })
  cantidad?: number;

  @Column({ name: 'ESTADOANTERIOR', type: 'nvarchar', length: 20, nullable: true })
  estadoAnterior?: string;

  @Column({ name: 'ESTADONUEVO', type: 'nvarchar', length: 20, nullable: true })
  estadoNuevo?: string;

  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 500, nullable: true })
  observacion?: string;

  @Column({ name: 'USUARIOOID', type: 'int' })
  usuarioId: number;
}
