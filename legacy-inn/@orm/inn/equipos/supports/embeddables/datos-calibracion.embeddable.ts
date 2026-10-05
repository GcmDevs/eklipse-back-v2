import { VariableCalibracion } from '@equipos/domain/value-objects';
import { Column } from 'typeorm';
import { variableMedidaTransformer } from '..';

export class DatosCalibracionEmbeddable {
  @Column({ name: 'CODULTCALIBRACION', type: 'varchar', nullable: true })
  codigoUltimaCalibracion?: string;

  @Column({
    name: 'VARIABLES',
    type: 'nvarchar',
    length: 'max',
    nullable: true,
    transformer: variableMedidaTransformer,
  })
  variables?: VariableCalibracion;
}
