import { BadInputError } from "@common/domain/errors";
import { UsuariosCreativos } from "@common/domain/enums";
import { Id } from "@common/domain/value-objects";
import { ModoFormato, TipoMantenimiento } from "@equipos/domain/enums";
import { VersionFormatoFmt } from "apps/motor-formatos/domain";

export class Formato {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private tipo: TipoMantenimiento,
    private modoFormato: ModoFormato,
    private codigo: string,
    private slug: string,
    private formatoOrigenId: Id | null,
    private versiones: VersionFormatoFmt[],
    private activo: boolean,
    private readonly creadoPor: UsuariosCreativos,
    private readonly creadoPorId: Id,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private descripcion?: string,
  ) { }


  private static create(
    nombre: string,
    tipo: TipoMantenimiento,
    codigo: string,
    slug: string,
    formatoOrigenId: number,
    creadoPorId: number,
    descripcion?: string
  ): Formato {

    this.validate(nombre, codigo, slug);

    return new Formato(
      new Id(),
      nombre,
      tipo,
      ModoFormato.OPERATIVO,
      codigo,
      slug,
      new Id(formatoOrigenId),
      [],
      true,
      UsuariosCreativos.USUARIO,
      new Id(creadoPorId),
      new Date(),
      new Date(),
      descripcion,
    );
  }


  static rebuild(
    id: number,
    nombre: string,
    tipo: TipoMantenimiento,
    modoFormato: ModoFormato,
    codigo: string,
    slug: string,
    formatoOrigenId: number | null,
    versiones: VersionFormatoFmt[],
    activo: boolean,
    creadoPor: UsuariosCreativos,
    creadoPorId: number,
    createdAt: Date,
    updatedAt: Date,
    descripcion?: string
  ): Formato {

    return new Formato(
      new Id(id),
      nombre,
      tipo,
      modoFormato,
      codigo,
      slug,
      formatoOrigenId ? new Id(formatoOrigenId) : null,
      versiones ?? [],
      activo,
      creadoPor,
      new Id(creadoPorId),
      createdAt,
      updatedAt,
      descripcion
    );
  }


  get getId(): Id {
    return this.id;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getSlug(): string {
    return this.slug;
  }
  get getDescripcion(): string | undefined {
    return this.descripcion;
  }
  get getTipo(): TipoMantenimiento {
    return this.tipo;
  }
  get getModo(): ModoFormato {
    return this.modoFormato;
  }
  get getFormatoOrigenId(): Id | null {
    return this.formatoOrigenId;
  }
  get getActivo(): boolean {
    return this.activo;
  }
  get getCreadoPor(): UsuariosCreativos {
    return this.creadoPor;
  }
  get getCreadoPorId(): Id {
    return this.creadoPorId;
  }
  get getVersiones(): VersionFormatoFmt[] {
    return [...this.versiones];
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }


  addVersion(version: VersionFormatoFmt): void {
    this.versiones.push(version);
  }

  deactivate(): void {
    this.activo = false;
  }

  activate(): void {
    this.activo = true;
  }

  private static validate(
    nombre: string,
    codigo: string,
    slug: string
  ): void {

    if (!nombre || nombre.trim().length === 0) {
      throw new BadInputError('El nombre es obligatorio');
    }

    if (!codigo || codigo.trim().length === 0) {
      throw new BadInputError('El código es obligatorio');
    }

    if (!slug || slug.trim().length === 0) {
      throw new BadInputError('El slug es obligatorio');
    }
  }

  clone(
    nuevoNombre: string,
    nuevoCodigo: string,
    nuevoSlug: string,
    usuarioId: number,
    versionFormatoId: number,
    etiquetaVersion: string | null,
    descripcion?: string,
    formatoDestino?: Formato,
  ): Formato {

    const versionFormatoClone = this.getVersiones.find(
      (vers) => vers.getId.getValor === versionFormatoId,
    );

    if (!versionFormatoClone) {
      throw new BadInputError(
        `No se encontró la versión ${versionFormatoId} del formato ${this.getNombre}`,
      );
    }

    if (formatoDestino) {
      const nuevaVersion = versionFormatoClone.clone(
        formatoDestino.getId.getValor,
        usuarioId,
        etiquetaVersion,
      );

      formatoDestino.addVersion(nuevaVersion);
      return formatoDestino;
    }

    Formato.validate(
      nuevoNombre,
      nuevoCodigo,
      nuevoSlug,
    );

    const nuevoFormato = Formato.create(
      nuevoNombre,
      this.tipo,
      nuevoCodigo,
      nuevoSlug,
      this.id.getValor,
      usuarioId,
      descripcion,
    );

    const primeraVersion = versionFormatoClone.clone(
      nuevoFormato.getId.getValor,
      usuarioId,
      etiquetaVersion,
    );

    nuevoFormato.addVersion(primeraVersion);

    return nuevoFormato;
  }
}
