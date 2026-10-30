import { UsuariosCreativos } from "@common/domain/enums";
import { Id } from "@common/domain/value-objects";
import { EstadoVersionFormato, TipoEventoVersionFormato } from "../enums";
import { VersionFormatoEvento } from "./auditoria";
import { SeccionVersionFormato } from "./secciones";

export class VersionFormatoFmt {
  private constructor(
    private readonly id: Id,
    private readonly formatoId: Id,
    private version: number,
    private etiquetaVersion: string | null,
    private estado: EstadoVersionFormato,
    private secciones: SeccionVersionFormato[],
    private configuracionImagenesId: Id,
    private schema: Record<string, unknown>,
    private publicadoPorId: Id | null,
    private fechaPublicacion: Date | null,
    private readonly creadoPor: UsuariosCreativos,
    private readonly creadoPorId: Id,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) { }


  static create(data: {
    formatoId: number,
    version: number,
    etiquetaVersion: string | null,
    secciones: SeccionVersionFormato[],
    configuracionImagenesId: number,
    schema: Record<string, unknown>,
    creadoPorId: number
  }): VersionFormatoFmt {

    if (data.version <= 0) {
      throw new Error('La versión debe ser mayor a 0');
    }

    return new VersionFormatoFmt(
      new Id(),
      new Id(data.formatoId),
      data.version,
      data.etiquetaVersion,
      EstadoVersionFormato.BORRADOR,
      data.secciones,
      new Id(data.configuracionImagenesId),
      data.schema,
      new Id(0),
      null,
      UsuariosCreativos.USUARIO,
      new Id(data.creadoPorId),
      new Date(),
      new Date()
    );
  }


  static rebuild(
    id: number,
    formatoId: number,
    version: number,
    etiquetaVersion: string | null,
    estado: EstadoVersionFormato,
    secciones: SeccionVersionFormato[],
    configuracionImagenesId: number,
    schema: Record<string, unknown>,
    publicadoPorId: number | null,
    fechaPublicacion: Date | null,
    creadoPor: UsuariosCreativos,
    creadoPorId: number,
    createdAt: Date,
    updatedAt: Date
  ): VersionFormatoFmt {

    return new VersionFormatoFmt(
      new Id(id),
      new Id(formatoId),
      version,
      etiquetaVersion,
      estado,
      secciones,
      new Id(configuracionImagenesId),
      schema,
      publicadoPorId ? new Id(publicadoPorId) : null,
      fechaPublicacion,
      creadoPor,
      new Id(creadoPorId),
      createdAt,
      updatedAt
    );
  }


  get getId(): Id {
    return this.id;
  }
  get getEstado(): EstadoVersionFormato {
    return this.estado;
  }
  get getFormatoId(): Id {
    return this.formatoId;
  }
  get getVersion(): number {
    return this.version;
  }
  get getEtiquetaVersion(): string {
    return this.etiquetaVersion;
  }
  get getConfiguracionImagenesId(): Id {
    return this.configuracionImagenesId;
  }
  get getSchema(): Record<string, unknown> {
    return this.schema;
  }
  get getPublicadoPorId(): Id | null {
    return this.publicadoPorId;
  }
  get getFechaPublicacion(): Date | null {
    return this.fechaPublicacion;
  }
  get getCreadoPor(): UsuariosCreativos {
    return this.creadoPor;
  }
  get getCreadoPorId(): Id {
    return this.creadoPorId;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
  get getSecciones(): SeccionVersionFormato[] {
    return [...this.secciones];
  }

  clone(
    nuevoFormatoId: number,
    usuarioCreadorId: number,
    etiquetaVersion: string | null,
  ): VersionFormatoFmt {
    if (!this.isPublicado()) throw new Error(`No se puede clonar a partir de una version no publicada o en borrador`)

    const configImgsId = this.getConfiguracionImagenesId;

    const nuevasSecciones = this.getSecciones.map(sec =>
      SeccionVersionFormato.create(
        undefined,
        sec.getSeccionId.getValor,
        sec.getOrdenMostrado
      )
    );

    const nuevaVersion = VersionFormatoFmt.create(
      {
        formatoId: nuevoFormatoId,
        version: 1,
        etiquetaVersion,
        secciones: nuevasSecciones,
        configuracionImagenesId: configImgsId.getValor,
        schema: this.schema,
        creadoPorId: usuarioCreadorId
      }
    );

    return nuevaVersion;
  }

  buildSchema(schema: Record<string, unknown>): void {
    this.validateEditable();
    this.schema = schema;
  }

  addSeccion(seccion: SeccionVersionFormato): void {
    this.validateEditable();
    const existeOrden = this.secciones.some(
      sec => sec.getOrdenMostrado === seccion.getOrdenMostrado
    );

    if (existeOrden) {
      throw new Error('Ya existe una sección con ese orden');
    }

    this.secciones.push(seccion);
  }


  publish(usuarioId: number): VersionFormatoEvento {
    if (this.estado !== EstadoVersionFormato.BORRADOR) {
      throw new Error('Solo se pueden publicar versiones en borrador');
    }

    if (this.secciones.length === 0) {
      throw new Error('No puedes publicar sin secciones');
    }

    this.estado = EstadoVersionFormato.PUBLICADO;
    this.publicadoPorId = new Id(usuarioId);
    this.fechaPublicacion = new Date();

    return VersionFormatoEvento.create(
      this.id.getValor,
      TipoEventoVersionFormato.PUBLICADO,
      usuarioId
    );
  }

  unPublish(usuarioId: number): VersionFormatoEvento {
    if (this.estado !== EstadoVersionFormato.PUBLICADO) {
      throw new Error('Solo se puede despublicar una versión publicada');
    }

    this.estado = EstadoVersionFormato.BORRADOR;
    this.publicadoPorId = null;
    this.fechaPublicacion = null;

    return VersionFormatoEvento.create(
      this.id.getValor,
      TipoEventoVersionFormato.DESPUBLICADO,
      usuarioId
    );
  }

  assingConfiguracionImagenes(configId: number): void {
    this.configuracionImagenesId = new Id(configId);
  }

  isPublicado(): boolean {
    return this.estado === EstadoVersionFormato.PUBLICADO;
  }

  private validateEditable(): void {
    if (this.estado === EstadoVersionFormato.PUBLICADO) {
      throw new Error('No puedes modificar una versión publicada');
    }
  }
}
