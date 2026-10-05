import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { TipoRespuestaItem } from 'apps/motor-formatos/domain';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.fmt.mantenimiento.ejecuciones_items })
@Unique('UQ_EKFMTEJEITEMS_TEXTO', ['texto', 'tipoRespuesta'])
export class EjecucionMantItemOrm extends BaseOrm {
  @Column({ type: 'varchar', length: 500, name: 'TEXTO' })
  texto: string;

  @Column({ enum: TipoRespuestaItem, name: 'TIPORESPUESTA', default: TipoRespuestaItem.BOOLEANO })
  tipoRespuesta: TipoRespuestaItem;

  @Column({ type: 'varchar', length: 40, name: 'ADICIONAL', nullable: true })
  adicional?: string;

  @Column({ type: 'varchar', length: 200, name: 'TEXTOAYUDA', nullable: true })
  textoAyuda: string | null;
}
