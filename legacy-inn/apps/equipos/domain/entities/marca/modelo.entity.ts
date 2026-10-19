import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export class Modelo {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private marcaId: Id,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(nombre: string, marcaId: number) {
    return new Modelo(
      new Id(),
      normalizeUppercaseText(nombre),
      new Id(marcaId),
      new Date(),
      new Date()
    );
  }

  static rebuild(id: number, nombre: string, marcaId: number, createdAt: Date, updatedAt: Date) {
    return new Modelo(new Id(id), nombre, new Id(marcaId), createdAt, updatedAt);
  }

  get getId(): Id {
    return this.id;
  }

  get getNombre(): string {
    return this.nombre;
  }

  get getMarcaId(): Id {
    return this.marcaId;
  }

  get getCreatedAt(): Date {
    return this.createdAt;
  }

  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
