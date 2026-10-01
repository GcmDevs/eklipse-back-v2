import { VariableCalibracion } from '@equipos/domain/value-objects';
import { Column } from 'typeorm';
import { ClasificacionBiomedicaEmbeddable } from './clasificacion-biomedica.embeddable';
import { MedidasTecnicasEmbedded } from './datos-tecnicos.embeddable';
import { PeriodoTiempoEmbeddable } from './periodo-tiempo.embeddable';
import { variableMedidaTransformer } from '..';

export class FichaTecnicaTipoEquipoEmbeddable {
  @Column(() => MedidasTecnicasEmbedded, { prefix: false })
  datosTecnicos?: MedidasTecnicasEmbedded;

  @Column(() => ClasificacionBiomedicaEmbeddable, { prefix: 'CLASFBIO' })
  clasificacionBiomedica?: ClasificacionBiomedicaEmbeddable;

  @Column(() => PeriodoTiempoEmbeddable, { prefix: 'VIDAUTIL' })
  vidaUtil?: PeriodoTiempoEmbeddable;

  @Column({ name: 'REQCALIBRACION', type: 'bit', default: false })
  reqCalibracion: boolean;

  @Column({
    name: 'DTCALIBVARIABLES',
    type: 'nvarchar',
    length: 'max',
    nullable: true,
    transformer: variableMedidaTransformer,
  })
  dtCalibVariables?: VariableCalibracion;

  @Column({ name: 'DTCALIBNORMAPLICABLE', type: 'varchar', length: 120, nullable: true })
  dtCalibNormaAplicable?: string;
}
