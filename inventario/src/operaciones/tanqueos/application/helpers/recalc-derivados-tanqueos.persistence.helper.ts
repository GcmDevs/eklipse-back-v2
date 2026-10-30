import { Tanqueo } from '@inn/operaciones/tanqueos/domain/entities';
import {
  findTanqueoIndexById,
  recalcularDerivadosDesdeIndice,
} from '@inn/operaciones/tanqueos/domain/helpers/recalc-derivados-tanqueos.helper';
import { TanqueoRepository } from '@inn/operaciones/tanqueos/domain/repositories';

export async function persistRecalcDerivadosDesdeTanqueo(
  repository: TanqueoRepository,
  activoId: number,
  tanqueoId: number,
  chain?: Tanqueo[]
): Promise<void> {
  const ordered = chain ?? await repository.findByActivoOrdered(activoId);
  const idx = findTanqueoIndexById(ordered, tanqueoId);
  if (idx < 0) return;
  recalcularDerivadosDesdeIndice(ordered, idx);
  for (let i = idx; i < ordered.length; i++) {
    await repository.update(ordered[i]);
  }
}

export async function persistRecalcDerivadosSiguiente(
  repository: TanqueoRepository,
  activoId: number,
  tanqueoAnuladoId: number
): Promise<void> {
  const ordered = await repository.findByActivoOrdered(activoId);
  const idx = findTanqueoIndexById(ordered, tanqueoAnuladoId);
  if (idx < 0 || idx + 1 >= ordered.length) return;
  recalcularDerivadosDesdeIndice(ordered, idx + 1);
  for (let i = idx + 1; i < ordered.length; i++) {
    await repository.update(ordered[i]);
  }
}
