import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { CausaCierreLimpieza, EstadoLimpieza } from '../enums';
import {
  countPendientesLimpieza,
  isItemAplicableLimpieza,
  TipoVehiculoLimpieza,
} from '../policies/declaracion-modalidad.policy';
import { LimpiezaDatosJson } from '../types';

export class LimpiezaFlota {
  private constructor(
    private readonly id: Id,
    private turnoId: Id,
    private vehiculoId: Id,
    private plantillaId: Id,
    private usuarioId: Id,
    private estado: EstadoLimpieza,
    private causaCierre: CausaCierreLimpieza | undefined,
    private reproceso: boolean | undefined,
    private totalNc: number,
    private datos: LimpiezaDatosJson | undefined,
    private fechaFinalizacion: Date | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static createBorrador(
    turnoId: number,
    vehiculoId: number,
    plantillaId: number,
    usuarioId: number,
    datos: LimpiezaDatosJson,
  ): LimpiezaFlota {
    const now = new Date();
    return new LimpiezaFlota(
      new Id(),
      new Id(turnoId),
      new Id(vehiculoId),
      new Id(plantillaId),
      new Id(usuarioId),
      EstadoLimpieza.BORRADOR,
      undefined,
      undefined,
      0,
      datos,
      undefined,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    turnoId: number,
    vehiculoId: number,
    plantillaId: number,
    usuarioId: number,
    estado: EstadoLimpieza,
    causaCierre: CausaCierreLimpieza | undefined,
    reproceso: boolean | undefined,
    totalNc: number,
    datos: LimpiezaDatosJson | undefined,
    fechaFinalizacion: Date | undefined,
    createdAt: Date,
    updatedAt: Date,
  ): LimpiezaFlota {
    return new LimpiezaFlota(
      new Id(id),
      new Id(turnoId),
      new Id(vehiculoId),
      new Id(plantillaId),
      new Id(usuarioId),
      estado,
      causaCierre,
      reproceso,
      totalNc,
      datos,
      fechaFinalizacion,
      createdAt,
      updatedAt,
    );
  }

  esVacia(tipo: TipoVehiculoLimpieza = 'AMBULANCIA'): boolean {
    const aplicables = (this.datos?.items ?? []).filter(i => isItemAplicableLimpieza(i.key, tipo));
    return aplicables.length === 0 || aplicables.every(i => i.respuesta === null);
  }

  assertBorradorEditable(usuarioId: number): void {
    if (this.estado !== EstadoLimpieza.BORRADOR) {
      throw new BadInputError('Solo se puede editar una limpieza en borrador');
    }
    if (this.usuarioId.getValor !== usuarioId) {
      throw new BadInputError('Solo el autor puede editar la limpieza');
    }
  }

  updateItem(
    key: string,
    patch: { respuesta?: 'C' | 'NC' | null; observacion?: string | null; evidencias?: number[] },
    usuarioId: number,
    tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
  ): void {
    this.assertBorradorEditable(usuarioId);
    const item = this.datos?.items.find(i => i.key === key);
    if (!item) throw new BadInputError(`Ítem ${key} no encontrado`);
    if (patch.respuesta !== undefined) item.respuesta = patch.respuesta;
    if (patch.observacion !== undefined) {
      if (patch.observacion === null || patch.observacion.trim() === '') {
        if (item.respuesta === 'NC') {
          throw new BadInputError('La observación es obligatoria para NC');
        }
        item.observacion = null;
      } else {
        item.observacion = patch.observacion.trim();
      }
    }
    if (patch.evidencias !== undefined) {
      if (
        !Array.isArray(patch.evidencias) ||
        patch.evidencias.some(id => typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
      ) {
        throw new BadInputError('Los IDs de evidencias deben ser enteros positivos');
      }
      item.evidencias = patch.evidencias;
    }
    if (item.respuesta === 'NC' && !item.observacion?.trim()) {
      throw new BadInputError('La observación es obligatoria para NC');
    }
    this.totalNc = (this.datos?.items ?? []).filter(
      i => isItemAplicableLimpieza(i.key, tipo) && i.respuesta === 'NC',
    ).length;
    this.updatedAt = new Date();
  }

  setReproceso(value: boolean | null, usuarioId: number): void {
    this.assertBorradorEditable(usuarioId);
    this.reproceso = value;
    this.updatedAt = new Date();
  }

  finalizar(
    confirmarIncompleto: boolean,
    now: Date,
    usuarioId: number,
    tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
  ): void {
    this.assertBorradorEditable(usuarioId);
    if (this.esVacia(tipo)) {
      throw new BadInputError('No hay ningún ítem respondido');
    }
    const pendientes = countPendientesLimpieza(this.datos?.items ?? [], tipo);
    if (pendientes > 0 && !confirmarIncompleto) {
      throw new BadInputError('La limpieza está incompleta', {
        businessCode: 'INCOMPLETA',
        details: { pendientes },
      });
    }
    this.estado = pendientes === 0 ? EstadoLimpieza.DILIGENCIADO : EstadoLimpieza.INCOMPLETO;
    this.causaCierre = CausaCierreLimpieza.MANUAL;
    this.fechaFinalizacion = now;
    this.updatedAt = now;
  }

  cerrarBorradorConContenido(causa: CausaCierreLimpieza, now: Date): void {
    if (this.estado !== EstadoLimpieza.BORRADOR) return;
    this.estado = EstadoLimpieza.INCOMPLETO;
    this.causaCierre = causa;
    this.fechaFinalizacion = now;
    this.updatedAt = now;
  }

  reasignar(nuevoUsuarioId: number, now: Date): void {
    this.usuarioId = new Id(nuevoUsuarioId);
    this.updatedAt = now;
  }

  aplicarCorreccionRevisar(
    cambios: Array<{ key: string; patch: { respuesta?: 'C' | 'NC' | null; observacion?: string | null; evidencias?: number[] } }>,
    reproceso: boolean | null | undefined,
    now: Date,
    tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
  ): Array<{ key: string; campo: string; anterior: unknown; nuevo: unknown }> {
    if (this.estado === EstadoLimpieza.BORRADOR) {
      throw new BadInputError('No se corrige una limpieza en borrador');
    }
    const diff: Array<{ key: string; campo: string; anterior: unknown; nuevo: unknown }> = [];
    for (const { key, patch } of cambios) {
      const item = this.datos?.items.find(i => i.key === key);
      if (!item) throw new BadInputError(`Ítem ${key} no encontrado`);
      if (patch.respuesta !== undefined && patch.respuesta !== item.respuesta) {
        diff.push({ key, campo: 'respuesta', anterior: item.respuesta, nuevo: patch.respuesta });
        item.respuesta = patch.respuesta;
      }
      if (patch.observacion !== undefined) {
        const nuevaObs = patch.observacion === null || patch.observacion.trim() === '' ? null : patch.observacion.trim();
        if (nuevaObs === null && item.respuesta === 'NC') {
          throw new BadInputError('La observación es obligatoria para NC');
        }
        if (nuevaObs !== item.observacion) {
          diff.push({ key, campo: 'observacion', anterior: item.observacion, nuevo: nuevaObs });
          item.observacion = nuevaObs;
        }
      }
      if (patch.evidencias !== undefined) {
        if (
          !Array.isArray(patch.evidencias) ||
          patch.evidencias.some(id => typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
        ) {
          throw new BadInputError('Los IDs de evidencias deben ser enteros positivos');
        }
        diff.push({ key, campo: 'evidencias', anterior: item.evidencias, nuevo: patch.evidencias });
        item.evidencias = patch.evidencias;
      }
      if (item.respuesta === 'NC' && !item.observacion?.trim()) {
        throw new BadInputError('La observación es obligatoria para NC');
      }
    }
    if (reproceso !== undefined && reproceso !== this.reproceso) {
      diff.push({ key: '_meta', campo: 'reproceso', anterior: this.reproceso, nuevo: reproceso });
      this.reproceso = reproceso;
    }
    this.totalNc = (this.datos?.items ?? []).filter(
      i => isItemAplicableLimpieza(i.key, tipo) && i.respuesta === 'NC',
    ).length;
    this.updatedAt = now;
    return diff;
  }

  get getId(): Id { return this.id; }
  get getTurnoId(): Id { return this.turnoId; }
  get getVehiculoId(): Id { return this.vehiculoId; }
  get getPlantillaId(): Id { return this.plantillaId; }
  get getUsuarioId(): Id { return this.usuarioId; }
  get getEstado(): EstadoLimpieza { return this.estado; }
  get getCausaCierre(): CausaCierreLimpieza | undefined { return this.causaCierre; }
  get getReproceso(): boolean | undefined { return this.reproceso; }
  get getTotalNc(): number { return this.totalNc; }
  get getDatos(): LimpiezaDatosJson | undefined { return this.datos; }
  get getFechaFinalizacion(): Date | undefined { return this.fechaFinalizacion; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
}
