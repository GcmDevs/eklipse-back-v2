import { BadInputError } from '@common/domain/errors';
import { TipoCombustible, UnidadMedidaCombustible } from '../enums';

export class CantidadCombustible {
  private constructor(
    private readonly cantidad: number,
    private readonly unidad: UnidadMedidaCombustible,
    private readonly tipo?: TipoCombustible
  ) {}

  static create(
    cantidad: number,
    unidad: UnidadMedidaCombustible,
    tipo?: TipoCombustible
  ): CantidadCombustible {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new BadInputError('La cantidad de combustible debe ser mayor que cero');
    }
    return new CantidadCombustible(cantidad, unidad, tipo);
  }

  get getValor(): number {
    return this.cantidad;
  }
  get getUnidadMedida(): UnidadMedidaCombustible {
    return this.unidad;
  }
  get getTipo(): TipoCombustible | undefined {
    return this.tipo;
  }

  exceedsCapacidad(capacidadTanque: number, margen = 0.95): boolean {
    return this.cantidad > capacidadTanque * margen;
  }

  calculateRendimiento(kilometrosRecorridos: number): number {
    return Number((kilometrosRecorridos / this.cantidad).toFixed(3));
  }
}
