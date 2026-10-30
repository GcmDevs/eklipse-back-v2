import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.entrega })
@Unique('UQ_AMBENTREGA_TURNOSALIENTE', ['turnoSalienteId'])
export class AmbEntregaOrm extends BaseTimestampedOrm {
  @Column({ name: 'VEHICULOOID', type: 'int' })
  vehiculoId: number;

  @Column({ name: 'TURNOSALIENTEOID', type: 'int' })
  turnoSalienteId: number;

  @Column({ name: 'TURNOENTRANTEOID', type: 'int', nullable: true })
  turnoEntranteId?: number;

  @Column({ name: 'PLANTILLAOID', type: 'int' })
  plantillaId: number;

  @Column({ name: 'ESTADO', type: 'varchar', length: 10 })
  estado: string;

  @Column({ name: 'CAUSACIERRE', type: 'varchar', length: 25, nullable: true })
  causaCierre?: string;

  @Column({ name: 'FECHAENTREGA', type: 'datetime2', nullable: true })
  fechaEntrega?: Date;

  @Column({ name: 'LIMITEINICIORECEPCION', type: 'datetime2', nullable: true })
  limiteInicioRecepcion?: Date;

  @Column({ name: 'HABILITAEXCEPCIONALEN', type: 'datetime2' })
  habilitaExcepcionalEn: Date;

  @Column({ name: 'CIERREAUTOMATICOEN', type: 'datetime2' })
  cierreAutomaticoEn: Date;

  @Column({ name: 'FECHACIERRE', type: 'datetime2', nullable: true })
  fechaCierre?: Date;

  @Column({ name: 'LANZADAPOROID', type: 'int', nullable: true })
  lanzadaPorId?: number;

  @Column({ name: 'EXTENDIDO', type: 'bit', default: false })
  extendido: boolean;
}
