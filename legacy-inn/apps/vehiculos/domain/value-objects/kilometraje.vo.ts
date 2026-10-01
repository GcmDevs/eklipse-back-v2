import { BadInputError } from '@common/domain/errors';
import { MAX_KILOMETRAJE } from '../policies/tanqueo-estacion.policies';

export class Kilometraje {
  private constructor(private readonly valor: number) {}

  static create(valor: number): Kilometraje {
    if (!Number.isInteger(valor) || valor <= 0 || valor > MAX_KILOMETRAJE) {
      throw new BadInputError(`El kilometraje debe ser un entero entre 1 y ${MAX_KILOMETRAJE}`);
    }
    return new Kilometraje(valor);
  }

  get getValorEnKm(): number {
    return this.valor;
  }

  isMenorQue(otro: Kilometraje): boolean {
    return this.valor < otro.valor;
  }

  distanciaDesde(anterior: Kilometraje): number {
    return this.valor - anterior.valor;
  }

  saltoExcesivoDesde(anterior: Kilometraje, umbralKm: number): boolean {
    return this.distanciaDesde(anterior) > umbralKm;
  }
}
