import { MedicamentoOrm } from './medicamento.orm';
import { RotuloMedicamentoOrm } from './rotulo-medicamentos.orm';

export * from './rotulo-medicamentos.orm';
export * from './medicamento.orm';

export const ROTULO_MEDICAMENTOS_ENTITIES = [RotuloMedicamentoOrm, MedicamentoOrm];
