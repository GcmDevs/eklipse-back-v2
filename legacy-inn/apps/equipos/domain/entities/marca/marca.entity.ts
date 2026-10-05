import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export class Marca {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private descripcion?: string
  ) {}

  static create(nombre: string, descripcion?: string): Marca {
    return new Marca(new Id(), normalizeUppercaseText(nombre), new Date(), new Date(), descripcion);
  }

  static rebuild(
    id: number,
    nombre: string,
    createdAt: Date,
    updatedAt: Date,
    descripcion?: string
  ): Marca {
    return new Marca(new Id(id), nombre, createdAt, updatedAt, descripcion);
  }

  get getId(): Id {
    return this.id;
  }

  get getNombre(): string {
    return this.nombre;
  }

  get getDescripcion(): string | undefined {
    return this.descripcion;
  }

  get getCreatedAt(): Date {
    return this.createdAt;
  }

  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
