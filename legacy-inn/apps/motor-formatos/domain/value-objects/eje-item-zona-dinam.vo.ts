import { Id } from '@common/domain/value-objects';

export class EjeMantItemGrupoZonaDinamica {
  private constructor(
    private readonly ejeMantItemId: Id,
    private readonly orden: number
  ) {}

  static create(ejeMantItemId: number, orden: number): EjeMantItemGrupoZonaDinamica {
    if (orden < 0) {
      throw new Error('El orden no puede ser negativo');
    }

    return new EjeMantItemGrupoZonaDinamica(new Id(ejeMantItemId), orden);
  }

  get getEjeMantItemId() {
    return this.ejeMantItemId;
  }
  get getOrden() {
    return this.orden;
  }
}
