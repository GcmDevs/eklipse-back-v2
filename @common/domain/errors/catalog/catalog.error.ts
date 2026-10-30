import { ErrorCode } from './codes.error';
import { ErrorName } from './names.error';

interface ErrorDefinition {
  name: ErrorName;
  code: ErrorCode;
}

export const ErrorCatalog: Record<ErrorName, ErrorDefinition> = {
  [ErrorName.NOT_FOUND]: {
    name: ErrorName.NOT_FOUND,
    code: ErrorCode.NOT_FOUND,
  },
  [ErrorName.BAD_REQUEST]: {
    name: ErrorName.BAD_REQUEST,
    code: ErrorCode.BAD_REQUEST,
  },
  [ErrorName.UNAUTHORIZED]: {
    name: ErrorName.UNAUTHORIZED,
    code: ErrorCode.UNAUTHORIZED,
  },
  [ErrorName.FORBIDDEN]: {
    name: ErrorName.FORBIDDEN,
    code: ErrorCode.FORBIDDEN,
  },
  [ErrorName.INTERNAL_SERVER_ERROR]: {
    name: ErrorName.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_SERVER_ERROR,
  },
  [ErrorName.CONFLICT]: {
    name: ErrorName.CONFLICT,
    code: ErrorCode.CONFLICT,
  },
};
