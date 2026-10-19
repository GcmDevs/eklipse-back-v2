import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import {
  MotivoAsignacionRecursoUsuario,
  MotivoFinalizacionAsignacionRecursoUsuario,
} from '@equipos/domain/enums';
import { AsignacionRecursoUsuario } from './asignacion-recurso-usuario.entity';

export class Recurso {
  private constructor(
    private readonly id: Id,
    private nombre: string,
    private activo: boolean,
    private asignaciones: AsignacionRecursoUsuario[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(nombre: string): Recurso {
    if (!nombre?.trim()) throw new BadInputError('El nombre del recurso es obligatorio');
    return new Recurso(new Id(), nombre.trim().toUpperCase(), true, [], new Date(), new Date());
  }

  static rebuild(
    id: number,
    nombre: string,
    activo: boolean,
    asignaciones: AsignacionRecursoUsuario[],
    createdAt: Date,
    updatedAt: Date
  ): Recurso {
    return new Recurso(new Id(id), nombre, activo, asignaciones, createdAt, updatedAt);
  }

  assingTecnico(data: {
    usuarioId: number;
    asignadoPorId: number;
    motivoAsignacion?: MotivoAsignacionRecursoUsuario | null;
    motivoAsignacionDetalle?: string | null;
    observaciones?: string;
  }): AsignacionRecursoUsuario {
    const asignacionActiva = this.getAsignacionActiva();
    if (asignacionActiva) {
      throw new BadInputError('El recurso ya tiene un tecnico asignado');
    }

    const nueva = AsignacionRecursoUsuario.create({
      recursoId: this.id.getValor,
      usuarioId: data.usuarioId,
      fechaInicio: new Date(),
      asignadoPorId: data.asignadoPorId,
      motivoAsignacion: data.motivoAsignacion ?? null,
      motivoAsignacionDetalle: data.motivoAsignacionDetalle ?? null,
      observaciones: data?.observaciones,
    });

    this.asignaciones.push(nueva);
    this.updatedAt = new Date();
    return nueva;
  }

  replaceTecnico(data: {
    usuarioId: number;
    asignadoPorId: number;
    motivoAsignacion?: MotivoAsignacionRecursoUsuario | null;
    motivoAsignacionDetalle?: string | null;
    motivoFinalizacion: MotivoFinalizacionAsignacionRecursoUsuario;
    motivoFinalizacionDetalle?: string | null;
  }): AsignacionRecursoUsuario {
    const asignacionActiva = this.getAsignacionActiva();

    if (!asignacionActiva) {
      throw new BadInputError('El recurso no tiene una asignación activa');
    }

    if (asignacionActiva.getUsuarioId.getValor === data.usuarioId) {
      throw new BadInputError('El tecnico indicado ya está asignado');
    }

    asignacionActiva.finalize({
      finalizadoPorId: data.asignadoPorId,
      motivoFinalizacion: data.motivoFinalizacion,
      motivoFinalizacionDetalle: data.motivoFinalizacionDetalle ?? null,
    });

    const nueva = AsignacionRecursoUsuario.create({
      recursoId: this.id.getValor,
      usuarioId: data.usuarioId,
      fechaInicio: new Date(),
      asignadoPorId: data.asignadoPorId,
      motivoAsignacion: data.motivoAsignacion ?? null,
      motivoAsignacionDetalle: data.motivoAsignacionDetalle ?? null,
    });

    this.asignaciones.push(nueva);
    this.updatedAt = new Date();
    return nueva;
  }

  removeTecnico(data: {
    finalizadoPorId: number;
    motivoFinalizacion: MotivoFinalizacionAsignacionRecursoUsuario;
    motivoFinalizacionDetalle?: string | null;
  }): void {
    const asignacionActiva = this.getAsignacionActiva();

    if (!asignacionActiva) {
      throw new BadInputError('El recurso no tiene asignación activa');
    }

    asignacionActiva.finalize({
      finalizadoPorId: data.finalizadoPorId,
      motivoFinalizacion: data.motivoFinalizacion,
      motivoFinalizacionDetalle: data.motivoFinalizacionDetalle ?? null,
    });

    this.updatedAt = new Date();
  }

  deactivate(): void {
    if (!this.activo) throw new BadInputError('El recurso ya está inactivo');
    this.activo = false;
    this.updatedAt = new Date();
  }

  reactivate(): void {
    if (this.activo) throw new BadInputError('El recurso ya esta activo');
    this.activo = true;
    this.updatedAt = new Date();
  }

  getAsignacionActiva(): AsignacionRecursoUsuario | null {
    return this.asignaciones.find(a => a.isActiva) ?? null;
  }

  getUsuarioActivoId(): number | null {
    return this.getAsignacionActiva()?.getUsuarioId.getValor ?? null;
  }

  get getId(): Id {
    return this.id;
  }
  get getNombre(): string {
    return this.nombre;
  }
  get isActivo(): boolean {
    return this.activo;
  }
  get getAsignaciones(): AsignacionRecursoUsuario[] {
    return [...this.asignaciones];
  }
  get getCreatedAt(): Date {
    return this.createdAt;
  }
  get getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
