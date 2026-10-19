import { ErrorCode, ErrorName } from './catalog';
import { DomainError } from './domain-error';

export class BadInputError extends DomainError {
  constructor(message: string = 'solicitud incorrecta') {
    super(ErrorName.BAD_REQUEST, ErrorCode.BAD_REQUEST, message);
  }
}
