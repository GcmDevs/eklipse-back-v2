import { Id } from "@common/domain/value-objects";

export class SeccionVersionFormato {
  private constructor(
    private readonly id: Id,
    private readonly versionFormatoId: Id,
    private readonly seccionId: Id,
    private ordenMostrado: number,
  ) { }

  static create(
    versionFormatoId: number,
    seccionId: number,
    ordenMostrado: number,
  ): SeccionVersionFormato {
    return new SeccionVersionFormato(
      new Id(),
      new Id(versionFormatoId),
      new Id(seccionId),
      ordenMostrado,
    );
  }

  static rebuild(
    id: number,
    versionFormatoId: number,
    seccionId: number,
    ordenMostrado: number,
  ): SeccionVersionFormato {
    return new SeccionVersionFormato(
      new Id(id),
      new Id(versionFormatoId),
      new Id(seccionId),
      ordenMostrado,
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getVersionFormatoId(): Id {
    return this.versionFormatoId;
  }
  get getSeccionId(): Id | null {
    return this.seccionId;
  }
  get getOrdenMostrado(): number {
    return this.ordenMostrado;
  }


  changeOrden(nuevoOrden: number): void {
    if (nuevoOrden < 0) {
      throw new Error('El orden no puede ser negativo');
    }
    this.ordenMostrado = nuevoOrden;
  }

  hasSeccion(): boolean {
    return this.seccionId !== null;
  }

  static validate(
    seccionId: number | null,
    ordenMostrado: number,
    esZonaDinamica: boolean
  ): void {

    if (ordenMostrado < 0) {
      throw new Error('El orden mostrado debe ser mayor o igual a 0');
    }

    if (!seccionId && !esZonaDinamica) {
      throw new Error(
        'Debe tener una sección'
      );
    }
  }
}
