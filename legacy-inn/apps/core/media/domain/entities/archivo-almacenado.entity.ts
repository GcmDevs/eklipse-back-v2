import { MimeTypes } from '@common/domain/enums';
import { BadInputError } from '@common/domain/errors';
import { Id } from "@common/domain/value-objects";

export class ArchivoAlmacenado {

  private constructor(
    private readonly id: Id,
    private nombreOriginal: string,
    private nombreAlmacenado: string,
    private extension: string,
    private tipoMime: MimeTypes,
    private tamanoBytes: number,
    private rutaArchivo: string,
    private rutaSegura: string | null,
    private contexto: string,
    private referenciaId: Id,
    private proveedorAlmacenamiento: string,
    private isTemporal: boolean,
    private isUsado: boolean,
    private fechaCarga: Date,
    private usuarioCargaId?: Id,
  ) { }

  static create(
    nombreOriginal: string,
    nombreAlmacenado: string,
    extension: string,
    tipoMime: MimeTypes,
    tamanoBytes: number,
    rutaArchivo: string,
  ): ArchivoAlmacenado {
    return new ArchivoAlmacenado(
      new Id(),
      nombreOriginal,
      nombreAlmacenado,
      extension,
      tipoMime,
      tamanoBytes,
      rutaArchivo,
      null,
      null,
      null,
      'local',
      true,
      false,
      new Date(),
      null,
    );
  }

  static rebuild(
    id: number,
    nombreOriginal: string,
    nombreAlmacenado: string,
    extension: string,
    tipoMime: MimeTypes,
    tamanoBytes: number,
    rutaArchivo: string,
    rutaSegura: string | null,
    contexto: string,
    referenciaId: number,
    proveedorAlmacenamiento: string,
    esTemporal: boolean,
    esUsado: boolean,
    fechaCarga: Date,
    usuarioCargaId?: number
  ): ArchivoAlmacenado {
    return new ArchivoAlmacenado(
      new Id(id),
      nombreOriginal,
      nombreAlmacenado,
      extension,
      tipoMime,
      tamanoBytes,
      rutaArchivo,
      rutaSegura,
      contexto,
      new Id(referenciaId),
      proveedorAlmacenamiento,
      esTemporal,
      esUsado,
      fechaCarga,
      usuarioCargaId ? new Id(usuarioCargaId) : undefined
    );
  }


  get getId(): Id {
    return this.id;
  }

  get getNombreOriginal(): string {
    return this.nombreOriginal;
  }

  get getNombreAlmacenado(): string {
    return this.nombreAlmacenado;
  }

  get getExtension(): string {
    return this.extension;
  }

  get getTipoMime(): MimeTypes {
    return this.tipoMime;
  }

  get getTamanoBytes(): number {
    return this.tamanoBytes;
  }

  get getRutaArchivo(): string {
    return this.rutaArchivo;
  }

  get getRutaSegura(): string | null {
    return this.rutaSegura;
  }

  get getProveedorAlmacenamiento(): string {
    return this.proveedorAlmacenamiento;
  }

  get getIsTemporal(): boolean {
    return this.isTemporal;
  }

  get getIsUsado(): boolean {
    return this.isUsado;
  }

  get getFechaCarga(): Date {
    return this.fechaCarga;
  }

  get getContexto(): string {
    return this.contexto;
  }

  get getReferenciaId(): Id {
    return this.referenciaId;
  }

  get getUsuarioCargaId(): Id {
    return this.usuarioCargaId;
  }

  MarkAsUsado(destino: string, contexto: string, referenciaId: number, usuarioCargaId?: number): void {
    this.isUsado = true;
    this.isTemporal = false;
    this.rutaArchivo = destino;
    this.contexto = contexto,
      this.referenciaId = new Id(referenciaId),
      this.usuarioCargaId = usuarioCargaId ? new Id(usuarioCargaId) : undefined,
      this.fechaCarga = new Date()
  }

  MarkAsTemporal(): void {
    this.isTemporal = true;
  }

  validateIsUsado() {
    if (this.getIsUsado || !this.getIsTemporal)
      throw new BadInputError(`Archivo con id: ${this.getId.getValor} ya esta en uso, por favor cargue otro`);

  }
}
