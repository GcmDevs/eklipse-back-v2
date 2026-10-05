import { Id } from '@common/domain/value-objects';
import { DefinicionImagen } from '../../value-objects';

export class SeccionAnexoImagenes {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private numeroSlots: number,
    private imagenes: DefinicionImagen[],
    private observacionGeneral?: string
  ) {}

  static create(data: {
    nombre: string;
    numeroSlots: number;
    imagenes: DefinicionImagen[];
    observacionGeneral?: string;
  }): SeccionAnexoImagenes {
    SeccionAnexoImagenes.validateImagenes(data.imagenes);

    return new SeccionAnexoImagenes(
      new Id(),
      data.nombre,
      data.numeroSlots,
      data.imagenes,
      data.observacionGeneral
    );
  }

  static rebuild(
    id: number,
    nombre: string,
    numeroSlots: number,
    imagenes: DefinicionImagen[],
    observacionGeneral?: string
  ): SeccionAnexoImagenes {
    SeccionAnexoImagenes.validateImagenes(imagenes);

    return new SeccionAnexoImagenes(new Id(id), nombre, numeroSlots, imagenes, observacionGeneral);
  }

  get getId(): Id {
    return this.id;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get getCantidadSlots(): number {
    return this.numeroSlots;
  }
  get getImagenes(): DefinicionImagen[] {
    return this.imagenes;
  }
  get getObservacionGeneral(): string | undefined {
    return this.observacionGeneral;
  }

  updateImagenes(imagenes: DefinicionImagen[]): void {
    SeccionAnexoImagenes.validateImagenes(imagenes);
    this.imagenes = imagenes;
  }

  updateObservacionGeneral(observacion?: string): void {
    this.observacionGeneral = observacion;
  }
  changeNombre(nombre: string): void {
    this.nombre = nombre;
  }

  private static validateImagenes(imagenes: DefinicionImagen[]): void {
    if (!imagenes || imagenes.length === 0) {
      throw new Error('Debe existir al menos una imagen');
    }

    const keys = imagenes.map(i => i.key);
    if (new Set(keys).size !== keys.length) {
      throw new Error('Las keys de imágenes deben ser únicas');
    }

    const ordenes = imagenes.map(i => i.orden);
    if (new Set(ordenes).size !== ordenes.length) {
      throw new Error('Los órdenes de imágenes deben ser únicos');
    }

    const ordenOrdenado = [...ordenes].sort((a, b) => a - b);
    for (let i = 0; i < ordenOrdenado.length; i++) {
      if (ordenOrdenado[i] !== i + 1) {
        throw new Error('El orden de imágenes debe ser consecutivo (1,2,3...)');
      }
    }
  }
}
