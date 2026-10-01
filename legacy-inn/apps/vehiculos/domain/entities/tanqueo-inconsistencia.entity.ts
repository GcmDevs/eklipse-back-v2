import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { CodigoInconsistencia, SeveridadInconsistencia } from '../enums';

export class TanqueoInconsistencia {
  private constructor(
    private readonly id: Id,
    private tanqueoId: Id,
    private codigo: CodigoInconsistencia,
    private campo: string | null,
    private severidad: SeveridadInconsistencia,
    private fechaDeteccion: Date,
    private resueltoPorUsuarioId: Id | null,
    private fechaResolucion: Date | null,
    private contactoRealizado: boolean,
    private notaContacto: string | null,
    private notaResolucion: string | null
  ) {}

  static create(
    tanqueoId: number,
    codigo: CodigoInconsistencia,
    severidad: SeveridadInconsistencia,
    campo?: string
  ): TanqueoInconsistencia {
    if (!tanqueoId) {
      throw new BadInputError('El ID del tanqueo es requerido');
    }
    if (!codigo || codigo.trim().length === 0) {
      throw new BadInputError('El código de la inconsistencia es requerido');
    }

    return new TanqueoInconsistencia(
      new Id(),
      new Id(tanqueoId),
      codigo,
      campo ? normalizeUppercaseText(campo) : null,
      severidad,
      new Date(),
      null,
      null,
      false,
      null,
      null
    );
  }

  static rebuild(
    id: number,
    tanqueoId: number,
    codigo: CodigoInconsistencia,
    campo: string | null,
    severidad: SeveridadInconsistencia,
    fechaDeteccion: Date,
    resueltoPorUsuarioId: number | null,
    fechaResolucion: Date | null,
    contactoRealizado: boolean,
    notaContacto: string | null,
    notaResolucion: string | null
  ): TanqueoInconsistencia {
    return new TanqueoInconsistencia(
      new Id(id),
      new Id(tanqueoId),
      codigo,
      campo,
      severidad,
      fechaDeteccion,
      resueltoPorUsuarioId !== null ? new Id(resueltoPorUsuarioId) : null,
      fechaResolucion,
      contactoRealizado,
      notaContacto,
      notaResolucion
    );
  }

  resolve(
    resueltoPorUsuarioId: number,
    contactoRealizado: boolean,
    notaResolucion?: string,
    notaContacto?: string
  ): void {
    if (this.fechaResolucion) {
      throw new BadInputError('La inconsistencia ya fue gestionada');
    }
    if (!resueltoPorUsuarioId) {
      throw new BadInputError('El usuario que resuelve es requerido');
    }
    if (!contactoRealizado && notaContacto?.trim()) {
      throw new BadInputError('La nota de contacto solo aplica cuando contactoRealizado es true');
    }
    this.contactoRealizado = contactoRealizado;
    this.resueltoPorUsuarioId = new Id(resueltoPorUsuarioId);
    this.fechaResolucion = new Date();
    this.notaResolucion = notaResolucion ? normalizeUppercaseText(notaResolucion) : null;
    this.notaContacto =
      contactoRealizado && notaContacto ? normalizeUppercaseText(notaContacto) : null;
  }

  isCritica(): boolean {
    return this.severidad === SeveridadInconsistencia.CRITICA;
  }

  isPendiente(): boolean {
    return this.fechaResolucion === null;
  }

  getElapsedHoras(): number {
    const ahora = new Date();
    const diffMs = ahora.getTime() - this.fechaDeteccion.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  get getId(): Id {
    return this.id;
  }

  get getTanqueoId(): Id {
    return this.tanqueoId;
  }

  get getCodigo(): CodigoInconsistencia {
    return this.codigo;
  }

  get getCampo(): string | null {
    return this.campo;
  }

  get getSeveridad(): SeveridadInconsistencia {
    return this.severidad;
  }

  get getFechaDeteccion(): Date {
    return this.fechaDeteccion;
  }

  get getResueltoPorUsuarioId(): Id | null {
    return this.resueltoPorUsuarioId;
  }

  get getFechaResolucion(): Date | null {
    return this.fechaResolucion;
  }

  get getContactoRealizado(): boolean {
    return this.contactoRealizado;
  }

  get getNotaContacto(): string | null {
    return this.notaContacto;
  }

  get getNotaResolucion(): string | null {
    return this.notaResolucion;
  }
}
