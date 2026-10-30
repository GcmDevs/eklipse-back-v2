import { Id } from "@common/domain/value-objects";
import { TipoEventoVersionFormato } from "../../enums";

export class VersionFormatoEvento {
  private constructor(
    private readonly id: Id,
    private readonly versionFormatoId: Id,
    private readonly tipoEvento: TipoEventoVersionFormato,
    private readonly usuarioId: Id,
    private readonly createdAt: Date
  ) { }

  static create(
    versionFormatoId: number,
    tipoEvento: TipoEventoVersionFormato,
    usuarioId: number,
  ): VersionFormatoEvento {
    return new VersionFormatoEvento(
      new Id(),
      new Id(versionFormatoId),
      tipoEvento,
      new Id(usuarioId),
      new Date(),
    );
  }

  static rebuild(
    id: number,
    versionFormatoId: number,
    tipoEvento: TipoEventoVersionFormato,
    usuarioId: number,
    fecha: Date
  ): VersionFormatoEvento {
    return new VersionFormatoEvento(
      new Id(id),
      new Id(versionFormatoId),
      tipoEvento,
      new Id(usuarioId),
      fecha,
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getVersionFormatoId(): Id {
    return this.versionFormatoId;
  }
  get getTipoEvento(): TipoEventoVersionFormato {
    return this.tipoEvento;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getCratedAt(): Date {
    return this.createdAt;
  }
}
