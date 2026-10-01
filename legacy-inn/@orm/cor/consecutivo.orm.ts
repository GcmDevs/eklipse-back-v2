import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: TABLE_NAMES.cor.consec })
@Unique('UQ_EKCORCONSECUTIVOS_CODIGO', ['codigo'])
export class ConsecutivoOrm extends BaseTimestampedOrm {
  @Column({ name: 'CODIGO', type: 'varchar', length: 50 })
  codigo: string;

  @Column({ name: 'PREFIJO', type: 'varchar', length: 20 })
  prefijo: string;

  @Column({
    name: 'ULTVALOR',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
    type: 'bigint',
    default: 0,
  })
  ultimoValor: number;

  @Column({ name: 'LONGITUD', type: 'int', default: 6 })
  longitud: number;

  @Column({ name: 'SEPARADOR', type: 'varchar', length: 5, default: '-' })
  separador: string;

  @Column({ name: 'ANIO', type: 'smallint', nullable: true })
  anio: number;

  @Column({ name: 'ACTIVO', type: 'bit', default: true })
  activo: boolean;
}
