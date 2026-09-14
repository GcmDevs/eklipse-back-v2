import { BadRequestException, HttpException } from '@nestjs/common';

export function throwBoletaQuirurgicaError(error: unknown, fallback: string): never {
  if (error instanceof HttpException) throw error;

  const message = error instanceof Error && error.message ? error.message : fallback;

  throw new BadRequestException(message);
}
