import { BadInputError } from "@common/domain/errors";
import { Id } from "@common/domain/value-objects";

export class UnidadMedida {
  private constructor(
    private readonly id: Id,
    private readonly nombre: string,
    private readonly simbolo: string,
    private readonly esBase: boolean,
  ) { }

  public static create(
    nombre: string,
    simbolo: string,
    esBase: boolean,
  ): UnidadMedida {
    if (!nombre.trim() || !simbolo.trim())
      throw new BadInputError('La unidad de medida requiere nombre y simbolo');

    return new UnidadMedida(new Id(), nombre.trim(), simbolo.trim(), esBase);
  }

  public static rebuild(
    id: number,
    nombre: string,
    simbolo: string,
    esBase: boolean,
  ): UnidadMedida {
    return new UnidadMedida(new Id(id), nombre, simbolo, esBase);
  }

  get getId(): Id {
    return this.id;
  }

  get getNombre(): string {
    return this.nombre;
  }

  get getSimbolo(): string {
    return this.simbolo;
  }

  get getEsBase(): boolean {
    return this.esBase;
  }
}
