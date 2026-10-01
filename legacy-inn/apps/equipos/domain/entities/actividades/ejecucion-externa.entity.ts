import { BadInputError } from "@common/domain/errors";
import { Id } from "@common/domain/value-objects";
import { Anexo } from "@core/media/domain/entities";
import { MotivoEjecucionExternaExcepcional, TipoEjecutorExterno } from "@equipos/domain/enums";

export class EjecucionExterna {
  private constructor(
    private readonly id: Id,
    private readonly registroActividadId: Id,
    private readonly tipoEjecutor: TipoEjecutorExterno,
    private readonly tecnicoNombre: string,
    private readonly fechaEjecucion: Date,
    private readonly terceroTecnicoId: number | null,
    private readonly empresaTerceroId: number | null,
    private readonly empresaNombreSnapshot: string | null,
    private readonly observaciones: string | null,
    private readonly esExcepcional: boolean,
    private readonly motivoExcepcional: MotivoEjecucionExternaExcepcional | null,
    private readonly motivoExcepcionalDetalle: string | null,
    private readonly anexos: Anexo[],
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) { }

  static create(data: {
    registroActividadId: number;
    tipoEjecutor: TipoEjecutorExterno;
    tecnicoNombre: string;
    fechaEjecucion: Date;
    terceroTecnicoId?: number | null;
    empresaTerceroId?: number | null;
    empresaNombreSnapshot?: string | null;
    observaciones?: string | null;
    esExcepcional?: boolean;
    motivoExcepcional?: MotivoEjecucionExternaExcepcional | null;
    motivoExcepcionalDetalle?: string | null;
    anexos?: Anexo[];
  }): EjecucionExterna {
    EjecucionExterna.validate(data);
    return new EjecucionExterna(
      new Id(),
      new Id(data.registroActividadId),
      data.tipoEjecutor,
      data.tecnicoNombre.trim(),
      data.fechaEjecucion,
      data.terceroTecnicoId ?? null,
      data.empresaTerceroId ?? null,
      data.empresaNombreSnapshot ?? null,
      data.observaciones ?? null,
      data.esExcepcional ?? false,
      data.motivoExcepcional ?? null,
      data.motivoExcepcionalDetalle ?? null,
      data.anexos,
      new Date(),
      new Date(),
    );
  }

  static rebuild(
    id: number,
    registroActividadId: number,
    tipoEjecutor: TipoEjecutorExterno,
    tecnicoNombre: string,
    fechaEjecucion: Date,
    terceroTecnicoId: number | null,
    empresaTerceroId: number | null,
    empresaNombreSnapshot: string | null,
    observaciones: string | null,
    esExcepcional: boolean,
    motivoExcepcional: MotivoEjecucionExternaExcepcional | null,
    motivoExcepcionalDetalle: string | null,
    anexos: Anexo[],
    createdAt: Date,
    updatedAt: Date,
  ): EjecucionExterna {
    return new EjecucionExterna(
      new Id(id),
      new Id(registroActividadId),
      tipoEjecutor,
      tecnicoNombre,
      fechaEjecucion,
      terceroTecnicoId,
      empresaTerceroId,
      empresaNombreSnapshot,
      observaciones,
      esExcepcional,
      motivoExcepcional,
      motivoExcepcionalDetalle,
      anexos,
      createdAt,
      updatedAt,
    );
  }

  private static validate(data: {
    tecnicoNombre: string,
    tipoEjecutor: TipoEjecutorExterno,
    fechaEjecucion: Date,
    esExcepcional?: boolean,
    empresaTerceroId?: number,
    motivoExcepcional?: string | null,
  }): void {
    if (!data.tecnicoNombre?.trim())
      throw new BadInputError('El nombre del tecnico externo es requerido');

    if (data.tipoEjecutor === TipoEjecutorExterno.EMPRESA_CON_TECNICO
      && !data.empresaTerceroId)
      throw new BadInputError('Debe indicar la empresa cuando el tipo es EMPRESA_CON_TECNICO');

    if (data.esExcepcional && !data.motivoExcepcional)
      throw new BadInputError('Debe indicar el motivo de la ejecución excepcional');

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (data.fechaEjecucion > today)
      throw new BadInputError('La fecha de ejecución no puede ser futura');
  }

  get getId(): Id { return this.id; }
  get getRegistroActividadId(): Id { return this.registroActividadId; }
  get getTipoEjecutor(): TipoEjecutorExterno { return this.tipoEjecutor; }
  get getTecnicoNombre(): string { return this.tecnicoNombre; }
  get getFechaEjecucion(): Date { return this.fechaEjecucion; }
  get getTerceroTecnicoId(): number | null { return this.terceroTecnicoId; }
  get getEmpresaTerceroId(): number | null { return this.empresaTerceroId; }
  get getEmpresaNombreSnapshot(): string | null { return this.empresaNombreSnapshot; }
  get getObservaciones(): string | null { return this.observaciones; }
  get getEsExcepcional(): boolean { return this.esExcepcional; }
  get getMotivoExcepcional(): MotivoEjecucionExternaExcepcional | null { return this.motivoExcepcional; }
  get getMotivoExcepcionalDetalle(): string | null { return this.motivoExcepcionalDetalle; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
  get getAnexos(): Anexo[] { return this.anexos; }
}