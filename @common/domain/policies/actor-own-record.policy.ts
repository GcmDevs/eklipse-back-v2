import { ForbiddenAccessError } from '../errors';

export function assertActorCannotModifyOwnRecord(
  actorId: number,
  relatedUserIds: Array<number | null | undefined>,
  message = 'No puedes modificar un registro propio'
): void {
  for (const userId of relatedUserIds) {
    if (userId != null && userId === actorId) {
      throw new ForbiddenAccessError(message);
    }
  }
}
