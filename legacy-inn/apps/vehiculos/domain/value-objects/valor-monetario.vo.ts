import { BadInputError } from '@common/domain/errors';
import { validateValorTanqueoEstacion } from '../policies/tanqueo-estacion.policies';

export class ValorMonetario {
  private constructor(private readonly valor: number) {}

  static create(valor: number): ValorMonetario {
    if (valor <= 0) {
      throw new BadInputError('El valor pagado debe ser mayor que cero');
    }
    return new ValorMonetario(Math.round(valor));
  }

  static createTanqueoEstacion(valor: number): ValorMonetario {
    validateValorTanqueoEstacion(valor);
    return new ValorMonetario(Math.round(valor));
  }

  get getMonto(): number {
    return this.valor;
  }

  isInusualmenteAltoRespectoA(promedio: number, factorMaximo: number): boolean {
    return this.valor > promedio * factorMaximo;
  }
}
