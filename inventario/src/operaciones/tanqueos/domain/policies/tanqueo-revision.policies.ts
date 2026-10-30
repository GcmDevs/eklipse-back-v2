import { assertActorCannotModifyOwnRecord } from '@common/domain/policies';
import { Id } from '@common/domain/value-objects';

export function assertTanqueoReviewNotOwnRecord(
  actorId: number,
  registradoPorId: Id,
  conductorRealId: Id | null
): void {
  assertActorCannotModifyOwnRecord(
    actorId,
    [registradoPorId.getValor, conductorRealId?.getValor],
    'No puedes revisar un registro propio'
  );
}
