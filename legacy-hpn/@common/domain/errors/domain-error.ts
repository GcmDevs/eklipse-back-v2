import { ErrorName, ErrorCode } from './catalog';

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly name: ErrorName;

  constructor(name: ErrorName, code: ErrorCode, message: string) {
    super(message);
    this.name = name;
    this.code = code;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
