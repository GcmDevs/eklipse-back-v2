import { LecturaOdometroReferencia } from '@inn/operaciones/tanqueos/domain/repositories';
import { VehiculoRead } from '@inn/operaciones/tanqueos/domain/reads';

export function enrichVehiculoReadWithReferencia(
  read: VehiculoRead,
  referencia?: LecturaOdometroReferencia | null
): VehiculoRead {
  return {
    ...read,
    kilometrajeReferencia: referencia?.kilometraje ?? null,
    fechaReferencia: referencia?.fechaReferencia?.toISOString() ?? null,
    referenciaConfiable: !!referencia,
  };
}

export function enrichVehiculosReadWithReferencias(
  items: VehiculoRead[],
  referencias: Map<number, LecturaOdometroReferencia>
): VehiculoRead[] {
  return items.map(item =>
    enrichVehiculoReadWithReferencia(item, referencias.get(item.id) ?? null)
  );
}
