import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { EstadoCronograma, TipoActividad } from '@equipos/domain/enums';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.actividades.cronogramas })
@Unique('UQ_EKINNEQPACTCRONOGRAMAS_PERIODO_TIPO', ['anio', 'mes', 'tipo'])
export class CronogramaOrm extends BaseTimestampedOrm {
  @Column({ name: 'ANIO', type: 'smallint' })
  anio: number;

  @Column({ name: 'MES', type: 'tinyint' })
  mes: number;

  @Column({ name: 'TIPO', type: 'nvarchar', length: 30 })
  tipo: TipoActividad;

  @Column({
    name: 'ESTADO',
    type: 'nvarchar',
    length: 20,
    default: EstadoCronograma.ACTIVO,
  })
  estado: EstadoCronograma;

  @Column({
    name: 'METECUMPLIMIENTOPCT',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 90.0,
  })
  metaCumplimientoPct: number;

  @Column({ name: 'CREADOPOROID' })
  creadoPorId: number;

  @Column({ name: 'NOTAS', type: 'nvarchar', length: 600, nullable: true })
  notas: string | null;
}
