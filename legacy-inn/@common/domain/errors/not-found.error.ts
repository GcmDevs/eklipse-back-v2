import { ErrorCode, ErrorName } from './catalog';
import { DomainError } from './domain-error';

export class ResourceNotFoundError extends DomainError {
  constructor(message: string = 'Entity not found') {
    super(ErrorName.NOT_FOUND, ErrorCode.NOT_FOUND, message);
  }
}
