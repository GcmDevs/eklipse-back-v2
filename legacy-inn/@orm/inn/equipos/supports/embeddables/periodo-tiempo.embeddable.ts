import { UnidadTiempo } from 'apps/equipos/domain/enums';
import { Column } from 'typeorm';

export class PeriodoTiempoEmbeddable {
  @Column({ name: 'VALOR', type: 'smallint', nullable: true })
  valor?: number;

  @Column({ name: 'UNIDAD', type: 'nvarchar', length: 30, nullable: false })
  unidad?: UnidadTiempo;
}
