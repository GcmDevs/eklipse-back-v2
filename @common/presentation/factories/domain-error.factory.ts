import { BadInputError, ErrorCode } from '@common/domain/errors';
import { DomainError } from '@common/domain/errors/domain-error';
import {
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    HttpException,
} from '@nestjs/common';


export function throwDomainError(error: DomainError): HttpException {
    switch (error.code) {
        case ErrorCode.NOT_FOUND:
            return new NotFoundException(error.message);

        case ErrorCode.BAD_REQUEST: {
            const payload: Record<string, unknown> = { message: error.message };
            if (error instanceof BadInputError) {
                if (error.businessCode) payload.code = error.businessCode;
                if (error.details) payload.details = error.details;
            }
            return new BadRequestException(
                Object.keys(payload).length > 1 ? payload : error.message,
            );
        }

        case ErrorCode.UNAUTHORIZED:
            return new UnauthorizedException(error.message);

        case ErrorCode.FORBIDDEN:
            return new ForbiddenException(error.message);

        case ErrorCode.CONFLICT:
            return new ConflictException(error.message);

        case ErrorCode.INTERNAL_SERVER_ERROR:
            return new InternalServerErrorException(error.message);

        default:
            return new HttpException(
                { name: 'UNKNOWN_ERROR', code: error.code },
                500,
            );
    }
}
