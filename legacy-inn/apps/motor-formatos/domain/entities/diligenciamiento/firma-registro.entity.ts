import { Id } from "@common/domain/value-objects";
import { RolFirmaRegistro } from "@equipos/domain/enums";

export class FirmaRegistro {
  private constructor(
    private readonly id: Id,
    private readonly registroDiligenciadoId: Id,
    private readonly rol: RolFirmaRegistro,
    private usuarioId: Id | null,
    private terceroId: Id | null,
    private nombreFirmante: string | null,
    private archivoFirmaId: Id | null,
    private firmado: boolean,
    private fechaFirma: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createSlotPendiente(data: {
    registroDiligenciadoId: number;
    rol:                    RolFirmaRegistro;
  }): FirmaRegistro {
    return new FirmaRegistro(
      new Id(),
      new Id(data.registroDiligenciadoId),
      data.rol,
      null, null, null, null,
      false,
      null,
      new Date(),
      new Date(),
    );
  }

  static rebuild(
    id:                     number,
    registroDiligenciadoId: number,
    rol:                    RolFirmaRegistro,
    usuarioId:              number | null,
    terceroId:              number | null,
    nombreFirmante:         string | null,
    archivoFirmaId:         number | null,
    firmado:                boolean,
    fechaFirma:             Date | null,
    createdAt:              Date,
    updatedAt:              Date,
  ): FirmaRegistro {
    return new FirmaRegistro(
      new Id(id),
      new Id(registroDiligenciadoId),
      rol,
      usuarioId      ? new Id(usuarioId)      : null,
      terceroId      ? new Id(terceroId)      : null,
      nombreFirmante,
      archivoFirmaId ? new Id(archivoFirmaId) : null,
      firmado,
      fechaFirma,
      createdAt,
      updatedAt,
    );
  }

  singAsUsuario(data: {
    usuarioId:      number;
    nombreFirmante: string;
    archivoFirmaId: number;
  }): void {
    this.ensureNotFirmado();
    this.usuarioId      = new Id(data.usuarioId);
    this.terceroId      = null;
    this.nombreFirmante = data.nombreFirmante;
    this.archivoFirmaId = new Id(data.archivoFirmaId);
    this.firmado        = true;
    this.fechaFirma     = new Date();
    this.updatedAt      = new Date();
  }

  singAsTercero(data: {
    terceroId:      number;
    nombreFirmante: string;
    archivoFirmaId: number;
  }): void {
    this.ensureNotFirmado();
    this.usuarioId      = null;
    this.terceroId      = new Id(data.terceroId);
    this.nombreFirmante = data.nombreFirmante;
    this.archivoFirmaId = new Id(data.archivoFirmaId);
    this.firmado        = true;
    this.fechaFirma     = new Date();
    this.updatedAt      = new Date();
  }

  autoSingTecnico(data: {
    usuarioId:      number;
    nombreFirmante: string;
    archivoFirmaId: number;
  }): void {
    if (this.rol !== RolFirmaRegistro.TECNICO_EJECUTOR)
      throw new Error('Solo se puede auto-firmar el slot de TECNICO_EJECUTOR');
    this.singAsUsuario(data);
  }

  private ensureNotFirmado(): void {
    if (this.firmado) throw new Error('Este slot ya fue firmado');
  }

  get getId():                     Id               { return this.id; }
  get getRegistroDiligenciadoId(): Id               { return this.registroDiligenciadoId; }
  get getRol():                    RolFirmaRegistro { return this.rol; }
  get getUsuarioId():              Id | null        { return this.usuarioId; }
  get getTerceroId():              Id | null        { return this.terceroId; }
  get getNombreFirmante():         string | null    { return this.nombreFirmante; }
  get getArchivoFirmaId():         Id | null        { return this.archivoFirmaId; }
  get isFirmado():                 boolean          { return this.firmado; }
  get getFechaFirma():             Date | null      { return this.fechaFirma; }
  get getCreatedAt():              Date             { return this.createdAt; }
  get getUpdatedAt():              Date             { return this.updatedAt; }
}
