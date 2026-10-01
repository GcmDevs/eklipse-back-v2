import { Id } from '@common/domain/value-objects';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';

export class AuditTipoEquipo {
  private constructor(
    private id: Id,
    private readonly tipoEquipoId: Id,
    private readonly tipo: TipoAuditTipoEquipo,
    private readonly campo: string | null,
    private readonly valorAnterior: string | null,
    private readonly valorNuevo: string | null,
    private readonly sincronizo: boolean,
    private readonly usuarioId: Id,
    private readonly usuarioNombre: string,
    private readonly fechaCambio: Date,
    private readonly observaciones: string | null,
    private readonly correlationOid: string,
    private readonly createdAt: Date,
  ) { }

  static create(props: {
    tipoEquipoId: number;
    tipo: TipoAuditTipoEquipo;
    campo?: string | null;
    valorAnterior?: string | null;
    valorNuevo?: string | null;
    sincronizo: boolean;
    usuarioId: number;
    usuarioNombre: string;
    fechaCambio: Date;
    observaciones?: string | null;
    correlationOid: string;
  }): AuditTipoEquipo {
    return new AuditTipoEquipo(
      new Id(),
      new Id(props.tipoEquipoId),
      props.tipo,
      props.campo ?? null,
      props.valorAnterior ?? null,
      props.valorNuevo ?? null,
      props.sincronizo,
      new Id(props.usuarioId),
      props.usuarioNombre,
      props.fechaCambio,
      props.observaciones ?? null,
      props.correlationOid,
      new Date(),
    );
  }

  static rebuild(props: {
    id: number;
    tipoEquipoId: number;
    tipo: TipoAuditTipoEquipo;
    campo: string | null;
    valorAnterior: string | null;
    valorNuevo: string | null;
    sincronizo: boolean;
    usuarioId: number;
    usuarioNombre: string;
    fechaCambio: Date;
    observaciones: string | null;
    correlationOid: string;
    createdAt: Date;
  }): AuditTipoEquipo {
    return new AuditTipoEquipo(
      new Id(props.id),
      new Id(props.tipoEquipoId),
      props.tipo,
      props.campo,
      props.valorAnterior,
      props.valorNuevo,
      props.sincronizo,
      new Id(props.usuarioId),
      props.usuarioNombre,
      props.fechaCambio,
      props.observaciones,
      props.correlationOid,
      props.createdAt,
    );
  }

  assingIdPersistido(oid: number): void {
    if (this.id.isEmpty()) {
      this.id = new Id(oid);
    }
  }

  get getId(): Id { return this.id; }
  get getTipoEquipoId(): Id { return this.tipoEquipoId; }
  get getTipo(): TipoAuditTipoEquipo { return this.tipo; }
  get getCampo(): string | null { return this.campo; }
  get getValorAnterior(): string | null { return this.valorAnterior; }
  get getValorNuevo(): string | null { return this.valorNuevo; }
  get getSincronizo(): boolean { return this.sincronizo; }
  get getUsuarioId(): Id { return this.usuarioId; }
  get getUsuarioNombre(): string { return this.usuarioNombre; }
  get getFechaCambio(): Date { return this.fechaCambio; }
  get getObservaciones(): string | null { return this.observaciones; }
  get getCorrelationOid(): string { return this.correlationOid; }
  get getCreatedAt(): Date { return this.createdAt; }
}
