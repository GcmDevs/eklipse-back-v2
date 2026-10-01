export class RegistroImagen {
  constructor(
    private readonly key: string,
    private archivoId?: number
  ) { }

  static create(data: {
    key: string;
    archivoId?: number;
  }): RegistroImagen {
    return new RegistroImagen(
      data.key,
      data.archivoId
    );
  }

  get getKey(): string {
    return this.key;
  }

  get getArchivoId(): number {
    return this.archivoId;
  }

  asignarArchivo(archivoId: number): void {
    this.archivoId = archivoId;
  }
}
