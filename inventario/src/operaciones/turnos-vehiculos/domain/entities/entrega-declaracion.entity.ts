import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import {
  CausaCierreDeclaracion,
  EstadoDeclaracion,
  ModalidadDeclaracion,
  RespuestaEntregaItem,
  RolDeclaracion,
} from '../enums';
import { calcLimiteEdicionRecepcion } from '../policies/entrega-deadlines.policy';
import { countPendientesEntrega, resolveModalidadEntrega } from '../policies/declaracion-modalidad.policy';
import { EntregaDatosJson, EntregaItemJson } from '../types';

export class EntregaDeclaracion {
  private constructor(
    private readonly id: Id,
    private entregaId: Id,
    private rol: RolDeclaracion,
    private usuarioId: Id,
    private fechaInicio: Date,
    private estado: EstadoDeclaracion,
    private modalidad: ModalidadDeclaracion | undefined,
    private causaCierre: CausaCierreDeclaracion | undefined,
    private limiteEdicion: Date | undefined,
    private fechaCierre: Date | undefined,
    private datos: EntregaDatosJson,
    private extendido: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createEntrega(entregaId: number, usuarioId: number, datos: EntregaDatosJson): EntregaDeclaracion {
    const now = new Date();
    return new EntregaDeclaracion(
      new Id(),
      new Id(entregaId),
      RolDeclaracion.ENTREGA,
      new Id(usuarioId),
      now,
      EstadoDeclaracion.EN_EDICION,
      undefined,
      undefined,
      undefined,
      undefined,
      datos,
      false,
      now,
      now,
    );
  }

  static createRecepcion(entregaId: number, usuarioId: number, datos: EntregaDatosJson): EntregaDeclaracion {
    const now = new Date();
    return new EntregaDeclaracion(
      new Id(),
      new Id(entregaId),
      RolDeclaracion.RECEPCION,
      new Id(usuarioId),
      now,
      EstadoDeclaracion.EN_EDICION,
      undefined,
      undefined,
      calcLimiteEdicionRecepcion(now),
      undefined,
      datos,
      false,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    entregaId: number,
    rol: RolDeclaracion,
    usuarioId: number,
    fechaInicio: Date,
    estado: EstadoDeclaracion,
    modalidad: ModalidadDeclaracion | undefined,
    causaCierre: CausaCierreDeclaracion | undefined,
    limiteEdicion: Date | undefined,
    fechaCierre: Date | undefined,
    datos: EntregaDatosJson,
    createdAt: Date,
    updatedAt: Date,
    extendido = false,
  ): EntregaDeclaracion {
    return new EntregaDeclaracion(
      new Id(id),
      new Id(entregaId),
      rol,
      new Id(usuarioId),
      fechaInicio,
      estado,
      modalidad,
      causaCierre,
      limiteEdicion,
      fechaCierre,
      datos,
      extendido,
      createdAt,
      updatedAt,
    );
  }

  assertEditable(usuarioId: number, now: Date): void {
    if (this.estado !== EstadoDeclaracion.EN_EDICION) {
      throw new BadInputError('La declaración no está en edición');
    }
    if (this.usuarioId.getValor !== usuarioId) {
      throw new BadInputError('Solo el autor de la declaración puede editarla');
    }
    if (this.limiteEdicion && now.getTime() >= this.limiteEdicion.getTime()) {
      throw new BadInputError('El plazo de edición ha vencido');
    }
  }

  updateItem(key: string, patch: Partial<EntregaItemJson>, now: Date, usuarioId: number): void {
    this.assertEditable(usuarioId, now);
    const item = this.datos.items.find(i => i.key === key);
    if (!item) throw new BadInputError(`Ítem ${key} no encontrado`);
    if (patch.respuesta !== undefined) item.respuesta = patch.respuesta;
    if (patch.observacion !== undefined) {
      const trimmed = patch.observacion?.trim();
      item.observacion = trimmed ? patch.observacion : null;
    }
    if (patch.evidencias !== undefined) {
      if (!Array.isArray(patch.evidencias) || patch.evidencias.some(id => !Number.isInteger(id) || id <= 0)) {
        throw new BadInputError('Los IDs de evidencia deben ser enteros positivos');
      }
      item.evidencias = patch.evidencias;
    }
    const resp = item.respuesta as RespuestaEntregaItem;
    if (resp === RespuestaEntregaItem.NO && !item.observacion?.trim()) {
      throw new BadInputError('La observación es obligatoria cuando la respuesta es NO');
    }
    this.updatedAt = now;
  }

  cerrarManual(confirmarIncompleto: boolean, now: Date, usuarioId: number): void {
    this.assertEditable(usuarioId, now);
    const modalidad = resolveModalidadEntrega(this.datos.items);
    const pendientes = countPendientesEntrega(this.datos.items);
    if (modalidad === ModalidadDeclaracion.SIN_RESPUESTAS) {
      throw new BadInputError('No hay ningún ítem respondido');
    }
    if (modalidad !== ModalidadDeclaracion.COMPLETO && !confirmarIncompleto) {
      throw new BadInputError('La declaración está incompleta', {
        businessCode: 'INCOMPLETA',
        details: { pendientes },
      });
    }
    this.modalidad = modalidad;
    this.estado = EstadoDeclaracion.CERRADA;
    this.causaCierre = CausaCierreDeclaracion.MANUAL;
    this.fechaCierre = now;
    this.updatedAt = now;
  }

  /** Fija el plazo de edición si la declaración sigue abierta y no tenía límite. */
  programarLimiteEdicion(now: Date): boolean {
    if (this.estado !== EstadoDeclaracion.EN_EDICION || this.limiteEdicion) return false;
    this.limiteEdicion = calcLimiteEdicionRecepcion(now);
    this.updatedAt = now;
    return true;
  }

  cerrarAutomatico(causa: CausaCierreDeclaracion, now: Date): void {
    if (this.estado === EstadoDeclaracion.CERRADA) return;
    this.modalidad = resolveModalidadEntrega(this.datos.items);
    this.estado = EstadoDeclaracion.CERRADA;
    this.causaCierre = causa;
    this.fechaCierre = now;
    this.updatedAt = now;
  }

  aplicarCorreccionRevisar(
    cambios: Array<{ key: string; patch: Partial<EntregaItemJson> }>,
    now: Date,
  ): Array<{ key: string; campo: string; anterior: unknown; nuevo: unknown }> {
    if (this.estado !== EstadoDeclaracion.CERRADA) {
      throw new BadInputError('Solo se corrigen declaraciones cerradas');
    }
    const diff: Array<{ key: string; campo: string; anterior: unknown; nuevo: unknown }> = [];
    for (const { key, patch } of cambios) {
      const item = this.datos.items.find(i => i.key === key);
      if (!item) throw new BadInputError(`Ítem ${key} no encontrado`);
      if (patch.respuesta !== undefined && patch.respuesta !== item.respuesta) {
        diff.push({ key, campo: 'respuesta', anterior: item.respuesta, nuevo: patch.respuesta });
        item.respuesta = patch.respuesta;
      }
      if (patch.observacion !== undefined) {
        const trimmed = patch.observacion?.trim();
        const nuevaObs = trimmed ? patch.observacion : null;
        if (nuevaObs !== item.observacion) {
          diff.push({ key, campo: 'observacion', anterior: item.observacion, nuevo: nuevaObs });
          item.observacion = nuevaObs;
        }
      }
      if (patch.evidencias !== undefined) {
        if (!Array.isArray(patch.evidencias) || patch.evidencias.some(id => !Number.isInteger(id) || id <= 0)) {
          throw new BadInputError('Los IDs de evidencia deben ser enteros positivos');
        }
        diff.push({ key, campo: 'evidencias', anterior: item.evidencias, nuevo: patch.evidencias });
        item.evidencias = patch.evidencias;
      }
      const resp = item.respuesta as RespuestaEntregaItem;
      if (resp === RespuestaEntregaItem.NO && !item.observacion?.trim()) {
        throw new BadInputError('La observación es obligatoria cuando la respuesta es NO');
      }
    }
    this.modalidad = resolveModalidadEntrega(this.datos.items);
    this.updatedAt = now;
    return diff;
  }

  get getId(): Id { return this.id; }
  get getEntregaId(): Id { return this.entregaId; }
  get getRol(): RolDeclaracion { return this.rol; }
  get getUsuarioId(): Id { return this.usuarioId; }
  get getEstado(): EstadoDeclaracion { return this.estado; }
  get getModalidad(): ModalidadDeclaracion | undefined { return this.modalidad; }
  get getCausaCierre(): CausaCierreDeclaracion | undefined { return this.causaCierre; }
  get getLimiteEdicion(): Date | undefined { return this.limiteEdicion; }
  get getFechaCierre(): Date | undefined { return this.fechaCierre; }
  get getDatos(): EntregaDatosJson { return this.datos; }
  get getFechaInicio(): Date { return this.fechaInicio; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
  get getExtendido(): boolean { return this.extendido; }

  extenderPlazo(minutos: number, now: Date): Date {
    if (!this.limiteEdicion) throw new BadInputError('Esta declaración no tiene plazo de edición');
    if (this.extendido) throw new BadInputError('El plazo ya fue extendido una vez');
    if (now.getTime() >= this.limiteEdicion.getTime()) {
      throw new BadInputError('No se puede extender un plazo ya vencido');
    }
    this.limiteEdicion = new Date(this.limiteEdicion.getTime() + minutos * 60_000);
    this.extendido = true;
    this.updatedAt = now;
    return this.limiteEdicion;
  }
}
