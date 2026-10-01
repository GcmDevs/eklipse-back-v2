import { ErrorCode, ErrorName } from './catalog';
import { DomainError } from './domain-error';

export class UnauthenticatedError extends DomainError {
  constructor(message: string = 'No autorizado') {
    super(ErrorName.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, message);
  }
}
