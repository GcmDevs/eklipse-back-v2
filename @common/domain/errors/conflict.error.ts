import { ErrorCode, ErrorName } from "./catalog";
import { DomainError } from "./domain-error";

export class ConflictError extends DomainError {
    constructor(message: string = 'Conflict Exception') {
        super(ErrorName.CONFLICT, ErrorCode.CONFLICT, message);
    }
}