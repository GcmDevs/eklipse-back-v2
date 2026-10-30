import { BadInputError } from '@common/domain/errors';
import { Id, normalizeUppercaseText } from '@common/domain/value-objects';
import { CodigoInconsistencia, SeveridadInconsistencia } from '../enums';
import { EstadoInconsistencia, ResultadoInconsistencia } from '../enums/estados.enum';

export class TanqueoInconsistencia {
  private constructor(
    private readonly id: Id,
    private tanqueoId: Id,
    private codigo: CodigoInconsistencia,
    private campo: string | null,
    private severidad: SeveridadInconsistencia,
    private fechaDeteccion: Date,
    private estado: EstadoInconsistencia,
    private resultado: ResultadoInconsistencia | null,
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
      EstadoInconsistencia.ABIERTA,
      null,
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
    estado: EstadoInconsistencia,
    resultado: ResultadoInconsistencia | null,
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
      estado,
      resultado,
      resueltoPorUsuarioId !== null ? new Id(resueltoPorUsuarioId) : null,
      fechaResolucion,
      contactoRealizado,
      notaContacto,
      notaResolucion
    );
  }

  close(input: {
    resueltoPorUsuarioId: number;
    resultado: ResultadoInconsistencia;
    notaResolucion?: string | null;
    notaContacto?: string | null;
    contactoRealizado?: boolean;
    tieneCorreccionLigada?: boolean;
  }): void {
    if (this.estado === EstadoInconsistencia.CERRADA) {
      throw new BadInputError('La inconsistencia ya fue cerrada');
    }
    if (!input.resultado) {
      throw new BadInputError('Cerrar una inconsistencia exige RESULTADO');
    }
    if (input.resultado === ResultadoInconsistencia.CORREGIDA && !input.tieneCorreccionLigada) {
      throw new BadInputError('CORREGIDA exige una corrección ligada a la inconsistencia');
    }
    if (
      (input.resultado === ResultadoInconsistencia.JUSTIFICADA ||
        input.resultado === ResultadoInconsistencia.FALSO_POSITIVO) &&
      !input.notaResolucion?.trim()
    ) {
      throw new BadInputError('JUSTIFICADA y FALSO_POSITIVO exigen nota');
    }
    const nota = input.notaResolucion ? normalizeUppercaseText(input.notaResolucion) : null;

    this.estado = EstadoInconsistencia.CERRADA;
    this.resultado = input.resultado;
    this.resueltoPorUsuarioId = new Id(input.resueltoPorUsuarioId);
    this.fechaResolucion = new Date();
    this.contactoRealizado = input.contactoRealizado ?? this.contactoRealizado;
    this.notaResolucion = nota;
    this.notaContacto = input.notaContacto ? normalizeUppercaseText(input.notaContacto) : this.notaContacto;
  }

  closeJustificadaAutomatica(resueltoPorUsuarioId: number, nota: string): void {
    this.close({
      resueltoPorUsuarioId,
      resultado: ResultadoInconsistencia.JUSTIFICADA,
      notaResolucion: nota,
    });
  }

  isCritica(): boolean {
    return this.severidad === SeveridadInconsistencia.CRITICA;
  }

  isAbierta(): boolean {
    return this.estado === EstadoInconsistencia.ABIERTA;
  }

  isPendiente(): boolean {
    return this.isAbierta();
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
  get getEstadoInconsistencia(): EstadoInconsistencia {
    return this.estado;
  }
  get getResultado(): ResultadoInconsistencia | null {
    return this.resultado;
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
