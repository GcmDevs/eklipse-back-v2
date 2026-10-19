import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { EVIDENCIAS_ABASTECIMIENTO } from '../policies';
import { TipoCombustible, UnidadMedidaCombustible } from '../enums';
import { EvidenciaSinResolverError } from '../value-objects';
import {
  CantidadCombustible,
  CoordenadasGPS,
  EvidenciasTanqueo,
  ValorMonetario,
} from '../value-objects';

export class Abastecimiento {
  private constructor(
    private readonly id: Id,
    private codigo: string,
    private estacionServicioId: Id,
    private usuarioId: Id,
    private valorTotalPagado: ValorMonetario,
    private cantidadCombustible: CantidadCombustible | null,
    private tipoCombustible: TipoCombustible,
    private fechaAbastecimiento: Date,
    private ubicacion: CoordenadasGPS | null,
    private observaciones: string | null,
    private evidencias: EvidenciasTanqueo,
    private tanqueoId: Id | null,
    private repositorioId: Id | null,
    private clienteUuid: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static register(data: {
    codigo: string;
    estacionServicioId: number;
    usuarioId: number;
    valorTotalPagado: ValorMonetario;
    cantidadCombustible: CantidadCombustible | null;
    tipoCombustible: TipoCombustible;
    fechaAbastecimiento: Date;
    ubicacion: CoordenadasGPS | null;
    observaciones: string | null;
    evidencias: EvidenciasTanqueo;
    tanqueoId?: number | null;
    repositorioId?: number | null;
    clienteUuid?: string | null;
  }): Abastecimiento {
    if (data.tanqueoId && data.repositorioId) {
      throw new BadInputError(
        'Un abastecimiento no puede vincularse a un tanqueo directo y a un repositorio a la vez'
      );
    }
    const faltantes = data.evidencias.findTiposSinResolver(EVIDENCIAS_ABASTECIMIENTO);
    if (faltantes.length > 0) {
      throw new EvidenciaSinResolverError(faltantes);
    }
    const now = new Date();
    return new Abastecimiento(
      new Id(),
      data.codigo,
      new Id(data.estacionServicioId),
      new Id(data.usuarioId),
      data.valorTotalPagado,
      data.cantidadCombustible,
      data.tipoCombustible,
      data.fechaAbastecimiento,
      data.ubicacion,
      data.observaciones ? normalizeUppercaseText(data.observaciones) : null,
      data.evidencias,
      data.tanqueoId != null ? new Id(data.tanqueoId) : null,
      data.repositorioId != null ? new Id(data.repositorioId) : null,
      data.clienteUuid ?? null,
      now,
      now
    );
  }

  static rebuild(
    id: number,
    codigo: string,
    estacionServicioId: number,
    usuarioId: number,
    valorTotalPagado: ValorMonetario,
    cantidadCombustible: CantidadCombustible | null,
    tipoCombustible: TipoCombustible,
    fechaAbastecimiento: Date,
    ubicacion: CoordenadasGPS | null,
    observaciones: string | null,
    evidencias: EvidenciasTanqueo,
    tanqueoId: number | null,
    repositorioId: number | null,
    clienteUuid: string | null,
    createdAt: Date,
    updatedAt: Date
  ): Abastecimiento {
    return new Abastecimiento(
      new Id(id),
      codigo,
      new Id(estacionServicioId),
      new Id(usuarioId),
      valorTotalPagado,
      cantidadCombustible,
      tipoCombustible,
      fechaAbastecimiento,
      ubicacion,
      observaciones,
      evidencias,
      tanqueoId != null ? new Id(tanqueoId) : null,
      repositorioId != null ? new Id(repositorioId) : null,
      clienteUuid,
      createdAt,
      updatedAt
    );
  }

  linkTanqueo(tanqueoId: number): void {
    if (this.repositorioId) {
      throw new BadInputError('No se puede vincular un tanqueo a un abastecimiento de repositorio');
    }
    if (this.tanqueoId) {
      throw new BadInputError('El abastecimiento ya está vinculado 1 a 1 a un tanqueo');
    }
    this.tanqueoId = new Id(tanqueoId);
    this.updatedAt = new Date();
  }

  get getId(): Id {
    return this.id;
  }
  get getCodigo(): string {
    return this.codigo;
  }
  get getEstacionServicioId(): Id {
    return this.estacionServicioId;
  }
  get getUsuarioId(): Id {
    return this.usuarioId;
  }
  get getValorTotalPagado(): ValorMonetario {
    return this.valorTotalPagado;
  }
  get getCantidadCombustible(): CantidadCombustible | null {
    return this.cantidadCombustible;
  }
  get getTipoCombustible(): TipoCombustible {
    return this.tipoCombustible;
  }
  get getUnidadMedida(): UnidadMedidaCombustible | null {
    return this.cantidadCombustible?.getUnidadMedida ?? null;
  }
  get getFechaAbastecimiento(): Date {
    return this.fechaAbastecimiento;
  }
  get getUbicacion(): CoordenadasGPS | null {
    return this.ubicacion;
  }
  get getObservaciones(): string | null {
    return this.observaciones;
  }
  get getEvidencias(): EvidenciasTanqueo {
    return this.evidencias;
  }
  get getEvidenciasCompletas(): boolean {
    return this.evidencias.areAllCompletas();
  }
  get getTanqueoId(): Id | null {
    return this.tanqueoId;
  }
  get getRepositorioId(): Id | null {
    return this.repositorioId;
  }
  get getClienteUuid(): string | null {
    return this.clienteUuid;
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
