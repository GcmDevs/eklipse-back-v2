import { UnprocessableEntityException } from '@nestjs/common';

export function hashIdempotencyPayload(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64').slice(0, 64);
}

export type IdempotencyCached<T> = { hit: true; value: T } | { hit: false };

export function resolveIdempotencyHit<T>(
  stored: { responseBody: string; responseHash: string } | null,
  requestHash: string
): IdempotencyCached<T> {
  if (!stored) return { hit: false };
  if (stored.responseHash !== requestHash) {
    throw new UnprocessableEntityException(
      'La idempotency-key ya fue usada con un payload distinto'
    );
  }
  return { hit: true, value: JSON.parse(stored.responseBody) as T };
}
