import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.turnos_veh.dotacion_novedad })
@Unique('UQ_AMBDOTACIONNOVEDAD_DOT_ITEM', ['dotacionId', 'itemKey'])
export class AmbDotacionNovedadOrm extends BaseTimestampedOrm {
  @Column({ name: 'DOTACIONOID', type: 'int' })
  dotacionId: number;

  @Column({ name: 'ITEMKEY', type: 'varchar', length: 60 })
  itemKey: string;

  @Column({ name: 'ESTADO', type: 'varchar', length: 12 })
  estado: string;

  @Column({ name: 'CANTIDADESPERADA', type: 'int', nullable: true })
  cantidadEsperada?: number;

  @Column({ name: 'CANTIDADENCONTRADA', type: 'int', nullable: true })
  cantidadEncontrada?: number;

  @Column({ name: 'DIFERENCIA', type: 'int', nullable: true })
  diferencia?: number;

  @Column({ name: 'FECHAVENCREGISTRADA', type: 'date', nullable: true })
  fechaVencRegistrada?: string;

  @Column({ name: 'FECHAVENCOBSERVADA', type: 'date', nullable: true })
  fechaVencObservada?: string;

  @Column({ name: 'OBSERVACION', type: 'varchar', length: 500 })
  observacion: string;

  @Column({ name: 'RESUELTAPOROID', type: 'int', nullable: true })
  resueltaPorId?: number;

  @Column({ name: 'FECHARESOLUCION', type: 'datetime2', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'OBSERVACIONRESOLUCION', type: 'varchar', length: 500, nullable: true })
  observacionResolucion?: string;
}
