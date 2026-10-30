import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.eqp.hdv_eqp.medibles.unidades_medida })
@Unique('UQ_EKINNEQPHVUNIDADESMEDIDA_NOMBRE', ['nombre'])
export class UnidadMedidaOrm extends BaseOrm {
  @Column({ name: 'NOMBRE', type: 'varchar' })
  nombre: string;

  @Column({ name: 'SIMBOLO', type: 'varchar' })
  simbolo: string;

  @Column({ name: 'ESBASE', type: 'bit', nullable: false })
  esBase: boolean;
}
