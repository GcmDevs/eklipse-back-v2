import { ForbiddenAccessError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { assertTanqueoReviewNotOwnRecord } from './tanqueo-revision.policies';

describe('assertTanqueoReviewNotOwnRecord', () => {
  it('lanza ForbiddenAccessError cuando el actor es el registrador', () => {
    expect(() =>
      assertTanqueoReviewNotOwnRecord(10, new Id(10), null)
    ).toThrow(ForbiddenAccessError);
  });

  it('lanza ForbiddenAccessError cuando el actor es el conductor real', () => {
    expect(() =>
      assertTanqueoReviewNotOwnRecord(10, new Id(1), new Id(10))
    ).toThrow(ForbiddenAccessError);
  });

  it('permite revisar cuando el actor no es registrador ni conductor real', () => {
    expect(() =>
      assertTanqueoReviewNotOwnRecord(10, new Id(1), new Id(2))
    ).not.toThrow();
  });

  it('permite revisar cuando no hay conductor real y el actor es distinto', () => {
    expect(() =>
      assertTanqueoReviewNotOwnRecord(10, new Id(1), null)
    ).not.toThrow();
  });
});
