import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';

export const CAMPOS_CORREGIBLES_TANQUEO = [
  'KILOMETRAJE',
  'CANTCOMBUST',
  'VALORPAGADO',
  'ESTACIONOID',
  'FECHTANQUEO',
  'OBSERVACIONES',
  'ORIGEN',
  'REPOSITORIOOID',
] as const;

export type CampoCorregibleTanqueo = (typeof CAMPOS_CORREGIBLES_TANQUEO)[number];

export class TanqueoCorreccion {
  private constructor(
    private readonly id: Id,
    private readonly tanqueoId: Id,
    private readonly campo: string,
    private readonly valorAnterior: string | null,
    private readonly valorNuevo: string | null,
    private readonly motivo: string,
    private readonly inconsistenciaId: Id | null,
    private readonly usuarioId: Id,
    private readonly createdAt: Date
  ) {}

  static create(data: {
    tanqueoId: number;
    campo: string;
    valorAnterior: string | null;
    valorNuevo: string | null;
    motivo: string;
    usuarioId: number;
    inconsistenciaId?: number | null;
  }): TanqueoCorreccion {
    if (!data.motivo?.trim()) {
      throw new BadInputError('El motivo de la corrección es obligatorio');
    }
    if (data.campo === 'ESTADO') {
      throw new BadInputError('El estado del tanqueo no se corrige por este mecanismo');
    }
    return new TanqueoCorreccion(
      new Id(),
      new Id(data.tanqueoId),
      data.campo,
      data.valorAnterior,
      data.valorNuevo,
      normalizeUppercaseText(data.motivo),
      data.inconsistenciaId != null ? new Id(data.inconsistenciaId) : null,
      new Id(data.usuarioId),
      new Date()
    );
  }

  static rebuild(
    id: number,
    tanqueoId: number,
    campo: string,
    valorAnterior: string | null,
    valorNuevo: string | null,
    motivo: string,
    inconsistenciaId: number | null,
    usuarioId: number,
    createdAt: Date
  ): TanqueoCorreccion {
    return new TanqueoCorreccion(
      new Id(id),
      new Id(tanqueoId),
      campo,
      valorAnterior,
      valorNuevo,
      motivo,
      inconsistenciaId != null ? new Id(inconsistenciaId) : null,
      new Id(usuarioId),
      createdAt
    );
  }

  get getId(): Id {
    return this.id;
  }
  get getTanqueoId(): Id {
    return this.tanqueoId;
  }
  get getCampo(): string {
    return this.campo;
  }
  get getValorAnterior(): string | null {
    return this.valorAnterior;
  }
  get getValorNuevo(): string | null {
    return this.valorNuevo;
  }
  get getMotivo(): string {
    return this.motivo;
  }
  get getInconsistenciaId(): Id | null {
    return this.inconsistenciaId;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
}
