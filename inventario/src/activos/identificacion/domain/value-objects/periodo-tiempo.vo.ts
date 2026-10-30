import { BadInputError } from '@common/domain/errors';
import { UnidadTiempo } from '../enums';

export class PeriodoDeTiempo {
  private constructor(
    private readonly valor: number,
    private readonly unidad: UnidadTiempo
  ) { }

  static create(valor: number, unidad: UnidadTiempo): PeriodoDeTiempo {
    if (valor !== undefined && unidad !== undefined) {
      if (!this.isValidValor(valor)) {
        throw new BadInputError('El valor debe ser mayor a 0.');
      }
    }

    return new PeriodoDeTiempo(valor, unidad);
  }

  private static isValidValor(valor: number): boolean {
    return valor > 0;
  }

  get getValor(): number {
    return this.valor;
  }

  get getUnidad(): UnidadTiempo {
    return this.unidad;
  }

  toPrimitives(): any {
    return {
      valor: this.valor,
      unidad: this.getUnidad
    }
  }

}
