import { ErrorCode, ErrorName } from './catalog';
import { DomainError } from './domain-error';

export class BadInputError extends DomainError {
  readonly businessCode?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string = 'solicitud incorrecta',
    options?: { businessCode?: string; details?: Record<string, unknown> },
  ) {
    super(ErrorName.BAD_REQUEST, ErrorCode.BAD_REQUEST, message);
    this.businessCode = options?.businessCode;
    this.details = options?.details;
  }
}
