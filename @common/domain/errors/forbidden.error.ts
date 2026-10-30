import { ErrorCode, ErrorName } from './catalog';
import { DomainError } from './domain-error';

export class ForbiddenAccessError extends DomainError {
  constructor(message: string = 'Prohibido: acción no permitida.') {
    super(ErrorName.FORBIDDEN, ErrorCode.FORBIDDEN, message);
  }
}
