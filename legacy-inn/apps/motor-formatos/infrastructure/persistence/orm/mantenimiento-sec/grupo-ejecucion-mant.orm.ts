import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.mantenimiento.grupos_ejecucion })
@Unique('UQ_EKFMTEJEGRUPOS_NOMBRE', ['nombre'])
export class GrupoEjecucionMantOrm extends BaseOrm {
  @Column({ type: 'varchar', length: 110, name: 'NOMBRE' })
  nombre: string;
}
