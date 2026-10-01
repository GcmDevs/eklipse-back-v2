import { ErrorCode } from '@common/domain/errors';
import { DomainError } from '@common/domain/errors/domain-error';
import {
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    InternalServerErrorException,
    HttpException,
} from '@nestjs/common';


export function throwDomainError(error: DomainError): HttpException {
    switch (error.code) {
        case ErrorCode.NOT_FOUND:
            return new NotFoundException(error.message);

        case ErrorCode.BAD_REQUEST:
            return new BadRequestException(error.message);

        case ErrorCode.UNAUTHORIZED:
            return new UnauthorizedException(error.message);

        case ErrorCode.FORBIDDEN:
            return new ForbiddenException(error.message);

        case ErrorCode.INTERNAL_SERVER_ERROR:
            return new InternalServerErrorException(error.message);

        default:
            return new HttpException(
                { name: 'UNKNOWN_ERROR', code: error.code },
                500,
            );
    }
}
