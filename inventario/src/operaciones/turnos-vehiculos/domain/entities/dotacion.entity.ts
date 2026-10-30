import { BadInputError } from '@common/domain/errors';
import { Id } from '@common/domain/value-objects';
import { EstadoDotacion, EstadoItemDotacion, TipoAmbulanciaFlota } from '../enums';
import { calcFechaLimiteDotacion } from '../policies/entrega-deadlines.policy';
import { DotacionDatosJson } from '../types';

export class DotacionFlota {
  private constructor(
    private readonly id: Id,
    private vehiculoId: Id,
    private fecha: string,
    private tipoAmbulancia: TipoAmbulanciaFlota,
    private plantillaId: Id | undefined,
    private usuarioId: Id | undefined,
    private estado: EstadoDotacion,
    private completa: boolean | undefined,
    private bloqueada: boolean,
    private cierreAutomatico: boolean,
    private yaGuardada: boolean,
    private fechaInicio: Date | undefined,
    private fechaLimite: Date | undefined,
    private fechaUltimoCierre: Date | undefined,
    private datoBorrador: DotacionDatosJson | undefined,
    private datoConfirmado: DotacionDatosJson | undefined,
    private extendido: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static iniciarVerificacion(
    vehiculoId: number,
    fecha: string,
    tipoAmbulancia: TipoAmbulanciaFlota,
    plantillaId: number,
    usuarioId: number,
    datoBorrador: DotacionDatosJson,
  ): DotacionFlota {
    const now = new Date();
    return new DotacionFlota(
      new Id(),
      new Id(vehiculoId),
      fecha,
      tipoAmbulancia,
      new Id(plantillaId),
      new Id(usuarioId),
      EstadoDotacion.EN_CURSO,
      undefined,
      false,
      false,
      false,
      now,
      calcFechaLimiteDotacion(now),
      undefined,
      datoBorrador,
      undefined,
      false,
      now,
      now,
    );
  }

  static rebuild(
    id: number,
    vehiculoId: number,
    fecha: string,
    tipoAmbulancia: TipoAmbulanciaFlota,
    plantillaId: number | undefined,
    usuarioId: number | undefined,
    estado: EstadoDotacion,
    completa: boolean | undefined,
    bloqueada: boolean,
    cierreAutomatico: boolean,
    yaGuardada: boolean,
    fechaInicio: Date | undefined,
    fechaLimite: Date | undefined,
    fechaUltimoCierre: Date | undefined,
    datoBorrador: DotacionDatosJson | undefined,
    datoConfirmado: DotacionDatosJson | undefined,
    createdAt: Date,
    updatedAt: Date,
    extendido = false,
  ): DotacionFlota {
    return new DotacionFlota(
      new Id(id),
      new Id(vehiculoId),
      fecha,
      tipoAmbulancia,
      plantillaId ? new Id(plantillaId) : undefined,
      usuarioId ? new Id(usuarioId) : undefined,
      estado,
      completa,
      bloqueada,
      cierreAutomatico,
      yaGuardada,
      fechaInicio,
      fechaLimite,
      fechaUltimoCierre,
      datoBorrador,
      datoConfirmado,
      extendido,
      createdAt,
      updatedAt,
    );
  }

  assertResponsable(usuarioId: number): void {
    if (this.usuarioId?.getValor !== usuarioId) {
      throw new BadInputError('Solo el responsable de la verificación puede realizar esta acción');
    }
  }

  assertEditable(usuarioId: number, now: Date): void {
    this.assertResponsable(usuarioId);
    if (this.estado !== EstadoDotacion.EN_CURSO) {
      throw new BadInputError('La verificación no está en curso');
    }
    if (this.bloqueada) throw new BadInputError('La verificación está bloqueada');
    if (this.fechaLimite && now.getTime() >= this.fechaLimite.getTime()) {
      throw new BadInputError('El plazo de la verificación ha vencido');
    }
  }

  guardarItem(
    key: string,
    patch: {
      estado: EstadoItemDotacion;
      cantidadEncontrada?: number | null;
      fechaVencObservada?: string | null;
      observacion?: string | null;
    },
    cantidadEsperada: number | undefined,
    usuarioId: number,
    now: Date,
  ): void {
    this.assertEditable(usuarioId, now);
    const item = this.datoBorrador?.items.find(i => i.key === key);
    if (!item) throw new BadInputError(`Ítem ${key} no encontrado`);
    item.estado = patch.estado;
    if (patch.cantidadEncontrada !== undefined) item.cantidadEncontrada = patch.cantidadEncontrada;
    if (patch.fechaVencObservada !== undefined) item.fechaVencObservada = patch.fechaVencObservada;
    if (patch.observacion !== undefined) {
      const trimmed = patch.observacion?.trim();
      item.observacion = trimmed ? patch.observacion : null;
    }
    if (patch.estado === EstadoItemDotacion.NOVEDAD && !item.observacion?.trim()) {
      throw new BadInputError('La observación es obligatoria para novedad');
    }
    if (patch.estado === EstadoItemDotacion.CONFORME) {
      if (
        cantidadEsperada !== undefined &&
        patch.cantidadEncontrada !== undefined &&
        patch.cantidadEncontrada !== null &&
        patch.cantidadEncontrada !== cantidadEsperada
      ) {
        throw new BadInputError('CONFORME no admite cantidad distinta de la esperada');
      }
      if (
        item.fechaVencRegistrada &&
        patch.fechaVencObservada &&
        patch.fechaVencObservada !== item.fechaVencRegistrada
      ) {
        throw new BadInputError('CONFORME no admite fecha de vencimiento observada distinta');
      }
    }
    this.yaGuardada = true;
    this.updatedAt = now;
  }

  esVacia(): boolean {
    const items = this.datoBorrador?.items ?? [];
    return !items.length || items.every(i => i.estado === EstadoItemDotacion.PENDIENTE);
  }

  cerrar(now: Date, confirmarIncompleto?: boolean): void {
    if (this.estado !== EstadoDotacion.EN_CURSO) {
      throw new BadInputError('Solo se puede cerrar una verificación en curso');
    }
    if (this.fechaLimite && now.getTime() >= this.fechaLimite.getTime()) {
      throw new BadInputError('El plazo para cerrar la verificación ha vencido');
    }
    const pendientes = (this.datoBorrador?.items ?? []).filter(
      i => i.estado === EstadoItemDotacion.PENDIENTE,
    ).length;
    if (this.esVacia()) {
      throw new BadInputError('No hay ningún ítem respondido');
    }
    if (pendientes > 0 && !confirmarIncompleto) {
      throw new BadInputError('La verificación está incompleta', {
        businessCode: 'INCOMPLETA',
        details: { pendientes },
      });
    }
    this.datoConfirmado = JSON.parse(JSON.stringify(this.datoBorrador));
    this.completa = pendientes === 0;
    this.cierreAutomatico = false;
    this.estado = EstadoDotacion.CERRADA;
    this.fechaUltimoCierre = now;
    this.updatedAt = now;
  }

  reabrir(now: Date): void {
    if (this.estado !== EstadoDotacion.CERRADA) {
      throw new BadInputError('Solo se puede reabrir una verificación cerrada');
    }
    if (this.bloqueada) throw new BadInputError('La verificación está bloqueada');
    if (this.fechaLimite && now.getTime() >= this.fechaLimite.getTime()) {
      throw new BadInputError('El plazo de la verificación ha vencido');
    }
    this.datoBorrador = JSON.parse(JSON.stringify(this.datoConfirmado));
    this.estado = EstadoDotacion.EN_CURSO;
    this.updatedAt = now;
  }

  /**
   * Vencimiento con contenido. La fila vacía se ELIMINA en el servicio, no aquí.
   * Devuelve 'ELIMINAR' si está vacía y sin cierre previo.
   */
  aplicarVencimiento(now: Date): 'ELIMINAR' | 'CERRAR' | 'OMITIR' {
    if (this.bloqueada) return 'OMITIR';
    if (!this.fechaLimite || now.getTime() < this.fechaLimite.getTime()) return 'OMITIR';
    if (this.estado !== EstadoDotacion.EN_CURSO && !this.datoConfirmado) return 'OMITIR';

    if (this.datoConfirmado) {
      this.datoBorrador = undefined;
      this.bloqueada = true;
      this.cierreAutomatico = true;
      this.estado = EstadoDotacion.CERRADA;
      this.updatedAt = now;
      return 'CERRAR';
    }

    if (this.esVacia()) return 'ELIMINAR';

    this.datoConfirmado = JSON.parse(JSON.stringify(this.datoBorrador));
    this.completa = false;
    this.bloqueada = true;
    this.cierreAutomatico = true;
    this.fechaUltimoCierre = undefined;
    this.estado = EstadoDotacion.CERRADA;
    this.updatedAt = now;
    return 'CERRAR';
  }

  extenderPlazo(minutos: number, now: Date): Date {
    if (!this.fechaLimite) throw new BadInputError('La verificación no tiene plazo');
    if (this.extendido) throw new BadInputError('El plazo ya fue extendido una vez');
    if (now.getTime() >= this.fechaLimite.getTime()) {
      throw new BadInputError('No se puede extender un plazo ya vencido');
    }
    this.fechaLimite = new Date(this.fechaLimite.getTime() + minutos * 60_000);
    this.extendido = true;
    this.updatedAt = now;
    return this.fechaLimite;
  }

  aplicarCorreccionRevisar(
    cambios: Array<{
      key: string;
      patch: {
        estado?: EstadoItemDotacion;
        cantidadEncontrada?: number | null;
        fechaVencObservada?: string | null;
        observacion?: string | null;
      };
      cantidadEsperada?: number;
    }>,
    now: Date,
  ): Array<{ key: string; campo: string; anterior: unknown; nuevo: unknown }> {
    if (!this.datoConfirmado) {
      throw new BadInputError('No hay versión confirmada para corregir');
    }
    const diff: Array<{ key: string; campo: string; anterior: unknown; nuevo: unknown }> = [];
    for (const { key, patch, cantidadEsperada } of cambios) {
      const item = this.datoConfirmado.items.find(i => i.key === key);
      if (!item) throw new BadInputError(`Ítem ${key} no encontrado`);
      if (patch.estado !== undefined && patch.estado !== item.estado) {
        diff.push({ key, campo: 'estado', anterior: item.estado, nuevo: patch.estado });
        item.estado = patch.estado;
      }
      if (patch.cantidadEncontrada !== undefined && patch.cantidadEncontrada !== item.cantidadEncontrada) {
        diff.push({
          key,
          campo: 'cantidadEncontrada',
          anterior: item.cantidadEncontrada,
          nuevo: patch.cantidadEncontrada,
        });
        item.cantidadEncontrada = patch.cantidadEncontrada;
      }
      if (patch.fechaVencObservada !== undefined && patch.fechaVencObservada !== item.fechaVencObservada) {
        diff.push({
          key,
          campo: 'fechaVencObservada',
          anterior: item.fechaVencObservada,
          nuevo: patch.fechaVencObservada,
        });
        item.fechaVencObservada = patch.fechaVencObservada;
      }
      if (patch.observacion !== undefined) {
        const trimmed = patch.observacion?.trim();
        const nuevaObs = trimmed ? patch.observacion : null;
        if (nuevaObs !== item.observacion) {
          diff.push({ key, campo: 'observacion', anterior: item.observacion, nuevo: nuevaObs });
          item.observacion = nuevaObs;
        }
      }
      if (item.estado === EstadoItemDotacion.NOVEDAD && !item.observacion?.trim()) {
        throw new BadInputError('La observación es obligatoria para novedad');
      }
      if (item.estado === EstadoItemDotacion.CONFORME && cantidadEsperada !== undefined) {
        if (item.cantidadEncontrada != null && item.cantidadEncontrada !== cantidadEsperada) {
          throw new BadInputError('CONFORME no admite cantidad distinta de la esperada');
        }
      }
    }
    const pendientes = (this.datoConfirmado.items ?? []).filter(i => i.estado === EstadoItemDotacion.PENDIENTE).length;
    this.completa = pendientes === 0;
    this.updatedAt = now;
    return diff;
  }

  get getId(): Id { return this.id; }
  get getVehiculoId(): Id { return this.vehiculoId; }
  get getFecha(): string { return this.fecha; }
  get getTipoAmbulancia(): TipoAmbulanciaFlota { return this.tipoAmbulancia; }
  get getPlantillaId(): Id | undefined { return this.plantillaId; }
  get getUsuarioId(): Id | undefined { return this.usuarioId; }
  get getEstado(): EstadoDotacion { return this.estado; }
  get getCompleta(): boolean | undefined { return this.completa; }
  get getBloqueada(): boolean { return this.bloqueada; }
  get getCierreAutomatico(): boolean { return this.cierreAutomatico; }
  get getYaGuardada(): boolean { return this.yaGuardada; }
  get getFechaInicio(): Date | undefined { return this.fechaInicio; }
  get getFechaLimite(): Date | undefined { return this.fechaLimite; }
  get getFechaUltimoCierre(): Date | undefined { return this.fechaUltimoCierre; }
  get getDatoBorrador(): DotacionDatosJson | undefined { return this.datoBorrador; }
  get getDatoConfirmado(): DotacionDatosJson | undefined { return this.datoConfirmado; }
  get getCreatedAt(): Date { return this.createdAt; }
  get getUpdatedAt(): Date { return this.updatedAt; }
  get getExtendido(): boolean { return this.extendido; }
  get getBorradorDescartado(): boolean {
    return this.cierreAutomatico && !!this.fechaUltimoCierre;
  }
}
