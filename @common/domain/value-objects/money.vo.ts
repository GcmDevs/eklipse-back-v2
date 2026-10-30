import { BadInputError } from '@common/domain/errors';

export class Money {
  private constructor(private readonly amount: number) {}

  static zero(): Money {
    return new Money(0);
  }

  static of(value: number): Money {
    if (value < 0) {
      throw new BadInputError('El monto no puede ser negativo');
    }

    return new Money(Money.toStoredAmount(value));
  }

  private static toStoredAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }

  get value(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return Money.of(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    const result = this.amount - other.amount;

    if (result < 0) {
      throw new BadInputError(
        'El resultado de la operación no puede ser negativo',
      );
    }

    return Money.of(result);
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }

  isInusualmenteAltoRespectoA(
    promedio: number,
    factorMaximo: number,
  ): boolean {
    return this.amount > promedio * factorMaximo;
  }
}

