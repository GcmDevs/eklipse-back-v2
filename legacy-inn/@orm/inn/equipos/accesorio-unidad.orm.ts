import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { EstadoAccesorioUnidad } from '@equipos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EquipoOrm } from './equipo.orm';
import { AccesorioTipoEquipoOrm } from './catalogo/accesorio-tipo-equipo.orm';

@Entity({ name: TABLE_NAMES.inn.eqp.eq_accesorios_unidad })
export class AccesorioUnidadOrm extends BaseTimestampedOrm {
  @ManyToOne(() => EquipoOrm, equipo => equipo.accesoriosUnidad)
  @JoinColumn({ name: 'EQUIPOOID' })
  equipo: EquipoOrm;

  @ManyToOne(() => AccesorioTipoEquipoOrm, acc => acc.accesoriosUnidad)
  @JoinColumn({ name: 'ACCSTDOID' })
  accesorioEstandar: AccesorioTipoEquipoOrm;

  @Column({ name: 'PARTESNAP', type: 'varchar', length: 120 })
  parteSnap: string;

  @Column({
    name: 'ESTADO',
    type: 'varchar',
    length: 30,
    default: EstadoAccesorioUnidad.ENTREGADO,
  })
  estado: EstadoAccesorioUnidad;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 300, nullable: true })
  observaciones?: string;

  @Column({ name: 'DESCONTINUADO', type: 'bit', default: false })
  descontinuado: boolean;

  @Column({ name: 'FECHADESCONTINUADO', type: 'datetime2', nullable: true })
  fechaDescontinuado?: Date;
}
