import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { DotacionFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import {
  EntidadEventoFlota,
  EstadoDotacion,
  EstadoItemDotacion,
  EstadoNovedadDotacion,
  EstadoServicioAmbulancia,
  FormatoPlantilla,
  TipoAmbulanciaFlota,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import {
  addDaysYmd,
  dayFromDateString,
  fechaNegocioBogota,
  finDiaBogota,
  monthBounds,
  toIsoDateTime,
} from '@inn/operaciones/turnos-vehiculos/domain/helpers/bogota-time.helper';
import { DotacionDatosJson, PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import {
  DotacionGrillaCategoriaRead,
  DotacionGrillaFilaRead,
  DotacionGrillaItemsView,
  DotacionGrillaView,
  DotacionView,
  UsuarioLiteRead,
} from '@inn/operaciones/turnos-vehiculos/domain/read';
import { findPlantillaItem, flattenPlantillaEstructura, mapDotacionResultado, seedDotacionItemsFromPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import {
  AMBULANCIA_FLOTA_REPOSITORY,
  AmbulanciaFlotaRepository,
  DOTACION_FLOTA_REPOSITORY,
  DOTACION_NOVEDAD_REPOSITORY,
  DotacionFlotaRepository,
  DotacionNovedadRepository,
  ELEMENTO_VENC_FLOTA_REPOSITORY,
  ElementoVencFlotaRepository,
  EVENTO_FLOTA_REPOSITORY,
  EventoFlotaRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { UsuarioEqpService } from '@inn/core/identity/application/services/usuario-eqp.service';
import { VehiculosService } from '@inn/operaciones/tanqueos/application';
import { FlotaSearchService } from '../helpers/flota-search.service';
import { resolveVehiculoDisplay } from '../helpers/vehiculo-display.helper';
import { VencimientoService } from './vencimiento.service';
import { VencimientoProgramacionService } from './vencimiento-programacion.service';
import { DotacionNovedadSyncService } from '../helpers/dotacion-novedad-sync.service';
import { AmbEventoService } from './amb-evento.service';

@Injectable()
export class DotacionService {
  constructor(
    @Inject(DOTACION_FLOTA_REPOSITORY) private readonly dotacionRepo: DotacionFlotaRepository,
    @Inject(DOTACION_NOVEDAD_REPOSITORY) private readonly novedadRepo: DotacionNovedadRepository,
    @Inject(AMBULANCIA_FLOTA_REPOSITORY) private readonly ambRepo: AmbulanciaFlotaRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(ELEMENTO_VENC_FLOTA_REPOSITORY) private readonly vencRepo: ElementoVencFlotaRepository,
    @Inject(EVENTO_FLOTA_REPOSITORY) private readonly eventoRepo: EventoFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly vencimientoService: VencimientoService,
    private readonly programacion: VencimientoProgramacionService,
    private readonly eventoService: AmbEventoService,
    private readonly searchService: FlotaSearchService,
    private readonly vehiculoService: VehiculosService,
    private readonly usuarioService: UsuarioEqpService,
    private readonly novedadSync: DotacionNovedadSyncService,
  ) {}

  async iniciar(vehiculoId: number): Promise<DotacionView> {
    const usuario = getUser();
    const hoy = fechaNegocioBogota(new Date());
    const amb = await this.ambRepo.findByVehiculoId(vehiculoId);
    if (!amb) throw new BadInputError('Ambulancia no registrada');
    const existe = await this.dotacionRepo.findByVehiculoAndFecha(vehiculoId, hoy);
    if (existe) throw new BadInputError('Ya existe verificación para hoy');
    const formato =
      amb.getTipoAmbulancia === 'TAB' ? FormatoPlantilla.DOTACION_TAB : FormatoPlantilla.DOTACION_TAM;
    const plantilla = await this.plantillaRepo.findVigenteByFormato(formato);
    const vencs = await this.vencRepo.findByVehiculo(vehiculoId);
    const map = new Map(vencs.map(v => [v.getItemKey, v.getFechaVencimiento]));
    const datos = {
      items: seedDotacionItemsFromPlantilla(plantilla.getEstructura as PlantillaEstructuraJson, map),
    };
    const id = await this.txManager.transactional(async () => {
      const dot = DotacionFlota.iniciarVerificacion(
        vehiculoId,
        hoy,
        amb.getTipoAmbulancia,
        plantilla.getId.getValor,
        usuario.id,
        datos,
      );
      const saved = await this.dotacionRepo.save(dot);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.DOTACION,
        entidadId: saved.getId.getValor,
        tipoEvento: 'DOTACION_INICIADA',
        usuarioId: usuario.id,
        vehiculoId,
      });
      return saved.getId.getValor;
    });
    await this.programacion.sincronizar();
    return this.getById(id);
  }

  async getById(id: number): Promise<DotacionView> {
    const dot = await this.dotacionRepo.findById(id);
    if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
    const amb = await this.ambRepo.findByVehiculoId(dot.getVehiculoId.getValor);
    const display = await resolveVehiculoDisplay(this.vehiculoService, dot.getVehiculoId.getValor);
    const plantilla = dot.getPlantillaId
      ? await this.plantillaRepo.findById(dot.getPlantillaId.getValor)
      : null;
    const flat = plantilla
      ? flattenPlantillaEstructura(plantilla.getEstructura as PlantillaEstructuraJson)
      : [];
    const datos = this.datosActivos(dot);
    const items = flat.map(f => {
      const i = datos?.items.find(x => x.key === f.key);
      return {
        key: f.key,
        texto: f.texto,
        categoria: f.categoria,
        orden: f.orden,
        cantidadEsperada: f.cantidadEsperada,
        estado: i?.estado ?? EstadoItemDotacion.PENDIENTE,
        cantidadEncontrada: i?.cantidadEncontrada ?? null,
        diferencia:
          i?.cantidadEncontrada != null && f.cantidadEsperada != null
            ? i.cantidadEncontrada - f.cantidadEsperada
            : null,
        fechaVencRegistrada: i?.fechaVencRegistrada ?? null,
        fechaVencObservada: i?.fechaVencObservada ?? null,
        observacion: i?.observacion ?? null,
      };
    });
    const novs = await this.novedadRepo.findByDotacion(id);
    const usuarioCache = new Map<number, UsuarioLiteRead | null>();
    return {
      id: dot.getId.getValor,
      ambulancia: {
        id: amb?.getId.getValor,
        vehiculoId: dot.getVehiculoId.getValor,
        placa: display.placa,
        codigo: display.codigo,
        tipoAmbulancia: dot.getTipoAmbulancia,
        estadoServicio: amb?.getEstadoServicio ?? EstadoServicioAmbulancia.EN_SERVICIO,
      },
      fecha: dot.getFecha,
      estado: dot.getEstado,
      completa: dot.getCompleta,
      bloqueada: dot.getBloqueada,
      cierreAutomatico: dot.getCierreAutomatico,
      usuario: dot.getUsuarioId
        ? await this.usuarioLite(dot.getUsuarioId.getValor, usuarioCache)
        : null,
      fechaInicio: dot.getFechaInicio,
      fechaLimite: dot.getFechaLimite,
      fechaUltimoCierre: dot.getFechaUltimoCierre,
      borradorDescartado: dot.getBorradorDescartado,
      pendientes: items.filter(i => i.estado === EstadoItemDotacion.PENDIENTE).length,
      items,
      novedades: await Promise.all(
        novs.map(async n => ({
          id: n.getId.getValor,
          itemKey: n.getItemKey,
          estado: n.getEstado,
          cantidadEsperada: n.getCantidadEsperada,
          cantidadEncontrada: n.getCantidadEncontrada,
          diferencia: n.getDiferencia,
          fechaVencRegistrada: n.getFechaVencRegistrada,
          fechaVencObservada: n.getFechaVencObservada,
          observacion: n.getObservacion,
          resueltaPor: n.getResueltaPorId
            ? await this.usuarioLite(n.getResueltaPorId.getValor, usuarioCache)
            : undefined,
          fechaResolucion: n.getFechaResolucion,
          observacionResolucion: n.getObservacionResolucion,
        })),
      ),
    };
  }

  async search(params: {
    search?: string;
    vehiculoId?: number;
    desde?: string;
    hasta?: string;
    estado?: EstadoDotacion;
    completa?: boolean;
    page: number;
    limit: number;
  }): Promise<[DotacionView[], number]> {
    const searchScope = await this.searchService.resolveScope(params.search);
    const [rows, total] = await this.dotacionRepo.search({
      vehiculoId: params.vehiculoId,
      desde: params.desde,
      hasta: params.hasta,
      estado: params.estado,
      completa: params.completa,
      page: params.page,
      pageSize: params.limit,
      searchScope,
    });
    const items: DotacionView[] = [];
    for (const d of rows) {
      items.push(await this.toListView(d));
    }
    return [items, total];
  }

  async buildGrillaMensual(
    mes: number,
    anio: number,
    vehiculoId?: number,
    tipoAmbulancia?: string,
  ): Promise<DotacionGrillaView> {
    if (mes < 1 || mes > 12) throw new BadInputError('Mes inválido');
    const now = new Date();
    const hoy = fechaNegocioBogota(now);
    const { desde, hasta, diasEnMes } = monthBounds(anio, mes);
    await this.vencimientoService.resolverDotacionesEnCursoEnRango(desde, hasta, now);

    const dotaciones = await this.dotacionRepo.findByFechaRange(desde, hasta);
    const novedadCounts = await this.novedadRepo.countByDotacionIds(dotaciones.map(d => d.getId.getValor));
    const usuarioCache = new Map<number, UsuarioLiteRead | null>();
    const dotacionesByVehiculo = new Map<number, DotacionFlota[]>();
    for (const d of dotaciones) {
      const vid = d.getVehiculoId.getValor;
      const list = dotacionesByVehiculo.get(vid) ?? [];
      list.push(d);
      dotacionesByVehiculo.set(vid, list);
    }

    const vehiculoIds = new Set<number>();
    if (vehiculoId) {
      vehiculoIds.add(vehiculoId);
    } else {
      const enServicio = await this.ambRepo.findAllEnServicio();
      for (const a of enServicio) {
        if (tipoAmbulancia && a.getTipoAmbulancia !== tipoAmbulancia) continue;
        vehiculoIds.add(a.getVehiculoId.getValor);
      }
      for (const vid of dotacionesByVehiculo.keys()) vehiculoIds.add(vid);
    }

    const ambs: Array<{ vid: number; ambId: number; tipo: TipoAmbulanciaFlota; registrada: string }> = [];
    for (const vid of vehiculoIds) {
      const amb = await this.ambRepo.findByVehiculoId(vid);
      if (!amb) continue;
      if (tipoAmbulancia && amb.getTipoAmbulancia !== tipoAmbulancia) continue;
      ambs.push({
        vid,
        ambId: amb.getId.getValor,
        tipo: amb.getTipoAmbulancia,
        registrada: fechaNegocioBogota(amb.getCreatedAt),
      });
    }
    const eventos = await this.eventoRepo.findServicioByAmbulanciaIds(ambs.map(a => a.ambId));

    const filas: DotacionGrillaFilaRead[] = [];
    for (const row of ambs.sort((a, b) => a.vid - b.vid)) {
      const display = await resolveVehiculoDisplay(this.vehiculoService, row.vid);
      const byFecha = new Map((dotacionesByVehiculo.get(row.vid) ?? []).map(d => [d.getFecha, d]));
      const dias: DotacionGrillaFilaRead['dias'] = [];
      const inicio = row.registrada > desde ? row.registrada : desde;
      const fin = hoy < hasta ? hoy : hasta;
      if (inicio <= fin) {
        for (let f = inicio; f <= fin; f = addDaysYmd(f, 1)) {
          const d = byFecha.get(f);
          if (d) {
            const c = novedadCounts.get(d.getId.getValor);
            dias.push({
              dia: dayFromDateString(f),
              dotacionId: d.getId.getValor,
              resultado: mapDotacionResultado(
                d.getEstado,
                d.getCompleta,
                d.getCierreAutomatico,
                d.getFechaUltimoCierre,
              ),
              usuario: d.getUsuarioId ? await this.usuarioLite(d.getUsuarioId.getValor, usuarioCache) : null,
              fechaInicio: toIsoDateTime(d.getFechaInicio),
              novedadesAbiertas: c?.abiertas ?? 0,
              novedadesTotal: c?.total ?? 0,
              borradorDescartado: d.getBorradorDescartado,
            });
          } else {
            const resultado =
              f === hoy
                ? 'PENDIENTE_INICIAR'
                : this.enServicioA2359(eventos.get(row.ambId) ?? [], f)
                  ? 'SIN_VERIFICAR'
                  : 'FUERA_SERVICIO';
            dias.push({
              dia: dayFromDateString(f),
              dotacionId: null,
              resultado,
              usuario: null,
              fechaInicio: null,
              novedadesAbiertas: 0,
              novedadesTotal: 0,
              borradorDescartado: false,
            });
          }
        }
      }
      filas.push({
        ambulancia: {
          id: row.ambId,
          vehiculoId: row.vid,
          placa: display.placa,
          codigo: display.codigo,
          tipoAmbulancia: row.tipo,
        },
        dias,
        resumen: this.resumenGrilla(dias),
      });
    }

    return { mes, anio, diasEnMes, hoy, filas };
  }

  async buildGrillaItems(vehiculoId: number, mes: number, anio: number): Promise<DotacionGrillaItemsView> {
    if (mes < 1 || mes > 12) throw new BadInputError('Mes inválido');
    const now = new Date();
    const hoy = fechaNegocioBogota(now);
    const { desde, hasta, diasEnMes } = monthBounds(anio, mes);
    await this.vencimientoService.resolverDotacionesEnCursoEnRango(desde, hasta, now);

    const amb = await this.ambRepo.findByVehiculoId(vehiculoId);
    if (!amb) throw new ResourceNotFoundError('Ambulancia no registrada');
    const display = await resolveVehiculoDisplay(this.vehiculoService, vehiculoId);
    const turnoActivo = null;

    const dotaciones = await this.dotacionRepo.findByVehiculoAndFechaRange(vehiculoId, desde, hasta);
    const usuarioCache = new Map<number, UsuarioLiteRead | null>();
    const eventos = await this.eventoRepo.findServicioByAmbulanciaIds([amb.getId.getValor]);
    const registrada = fechaNegocioBogota(amb.getCreatedAt);
    const byFecha = new Map(dotaciones.map(d => [d.getFecha, d]));
    const registros: DotacionGrillaItemsView['registros'] = [];
    const inicio = registrada > desde ? registrada : desde;
    const fin = hoy < hasta ? hoy : hasta;
    if (inicio <= fin) {
      for (let f = inicio; f <= fin; f = addDaysYmd(f, 1)) {
        const d = byFecha.get(f);
        if (d) {
          registros.push({
            dia: dayFromDateString(f),
            dotacionId: d.getId.getValor,
            resultado: mapDotacionResultado(
              d.getEstado,
              d.getCompleta,
              d.getCierreAutomatico,
              d.getFechaUltimoCierre,
            ),
            usuario: d.getUsuarioId ? await this.usuarioLite(d.getUsuarioId.getValor, usuarioCache) : null,
            fechaInicio: toIsoDateTime(d.getFechaInicio),
            borradorDescartado: d.getBorradorDescartado,
          });
        } else {
          registros.push({
            dia: dayFromDateString(f),
            dotacionId: null,
            resultado:
              f === hoy
                ? 'PENDIENTE_INICIAR'
                : this.enServicioA2359(eventos.get(amb.getId.getValor) ?? [], f)
                  ? 'SIN_VERIFICAR'
                  : 'FUERA_SERVICIO',
            usuario: null,
            fechaInicio: null,
            borradorDescartado: false,
          });
        }
      }
    }

    const plantillaIds = [...new Set(dotaciones.map(d => d.getPlantillaId?.getValor).filter(Boolean) as number[])];
    const plantillas = (await this.plantillaRepo.findByIds(plantillaIds)).sort(
      (a, b) => b.getVersion - a.getVersion,
    );

    const itemKeys = new Set<string>();
    for (const d of dotaciones) {
      const datos = this.datosActivos(d);
      for (const it of datos?.items ?? []) itemKeys.add(it.key);
    }

    const flatByKey = new Map<string, ReturnType<typeof flattenPlantillaEstructura>[0]>();
    for (const key of itemKeys) {
      for (const p of plantillas) {
        const flat = flattenPlantillaEstructura(p.getEstructura as PlantillaEstructuraJson);
        const found = flat.find(f => f.key === key);
        if (found) {
          flatByKey.set(key, found);
          break;
        }
      }
    }

    const categoriasMap = new Map<string, DotacionGrillaCategoriaRead>();

    for (const key of [...itemKeys].sort()) {
      const meta = flatByKey.get(key);
      if (!meta) continue;
      const catKey = meta.categoria;
      let cat = categoriasMap.get(catKey);
      if (!cat) {
        cat = { key: catKey, nombre: meta.categoria, items: [] };
        categoriasMap.set(catKey, cat);
      }
      const dias: DotacionGrillaItemsView['categorias'][0]['items'][0]['dias'] = [];
      for (const d of dotaciones) {
        const dia = dayFromDateString(d.getFecha);
        const plantilla = plantillas.find(p => p.getId.getValor === d.getPlantillaId?.getValor);
        if (!plantilla) continue;
        const inVersion = flattenPlantillaEstructura(plantilla.getEstructura as PlantillaEstructuraJson).some(
          f => f.key === key,
        );
        if (!inVersion) continue;
        const item = this.datosActivos(d)?.items?.find(i => i.key === key);
        if (!item) continue;
        dias.push({
          dia,
          estado: this.mapItemGrillaEstado(item.estado),
          cantidadEncontrada: item.cantidadEncontrada,
        });
      }
      if (!dias.length) continue;
      cat.items.push({
        key,
        texto: meta.texto,
        cantidadEsperada: meta.cantidadEsperada,
        dias,
      });
    }

    const categorias = [...categoriasMap.values()]
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
      .map(c => ({
        ...c,
        items: c.items.sort((a, b) => a.texto.localeCompare(b.texto)),
      }));

    return {
      ambulancia: {
        id: amb.getId.getValor,
        vehiculoId,
        placa: display.placa,
        codigo: display.codigo,
        tipoAmbulancia: amb.getTipoAmbulancia,
        estadoServicio: amb.getEstadoServicio,
        turnoActivo,
      },
      mes,
      anio,
      diasEnMes,
      hoy,
      registros,
      categorias,
    };
  }

  private datosActivos(dot: DotacionFlota): DotacionDatosJson | undefined {
    if (dot.getEstado === EstadoDotacion.EN_CURSO) return dot.getDatoBorrador;
    return dot.getDatoConfirmado ?? dot.getDatoBorrador;
  }

  private mapItemGrillaEstado(estado: string): 'CONFORME' | 'NOVEDAD' | 'PENDIENTE' {
    if (estado === EstadoItemDotacion.CONFORME) return 'CONFORME';
    if (estado === EstadoItemDotacion.NOVEDAD) return 'NOVEDAD';
    return 'PENDIENTE';
  }

  private async usuarioLite(
    id: number,
    cache: Map<number, UsuarioLiteRead | null>,
  ): Promise<UsuarioLiteRead | null> {
    if (cache.has(id)) return cache.get(id) ?? null;
    try {
      const u = await this.usuarioService.findById(id);
      const lite = { id: u.id, nombre: (u as any).nombreCompleto ?? '' };
      cache.set(id, lite);
      return lite;
    } catch {
      cache.set(id, null);
      return null;
    }
  }

  private async toListView(dot: DotacionFlota): Promise<DotacionView> {
    const amb = await this.ambRepo.findByVehiculoId(dot.getVehiculoId.getValor);
    const display = await resolveVehiculoDisplay(this.vehiculoService, dot.getVehiculoId.getValor);
    let usuario: UsuarioLiteRead | null = null;
    if (dot.getUsuarioId) {
      const u = await this.usuarioService.findById(dot.getUsuarioId.getValor);
      usuario = { id: u.id, nombre: (u as any).nombreCompleto ?? '' };
    }
    return {
      id: dot.getId.getValor,
      ambulancia: {
        id: amb?.getId.getValor,
        vehiculoId: dot.getVehiculoId.getValor,
        placa: display.placa,
        codigo: display.codigo,
        tipoAmbulancia: dot.getTipoAmbulancia,
        estadoServicio: amb?.getEstadoServicio ?? EstadoServicioAmbulancia.EN_SERVICIO,
      },
      fecha: dot.getFecha,
      estado: dot.getEstado,
      completa: dot.getCompleta,
      bloqueada: dot.getBloqueada,
      cierreAutomatico: dot.getCierreAutomatico,
      usuario,
      fechaInicio: dot.getFechaInicio,
      fechaLimite: dot.getFechaLimite,
      fechaUltimoCierre: dot.getFechaUltimoCierre,
      borradorDescartado: dot.getBorradorDescartado,
      pendientes: 0,
      items: [],
      novedades: [],
    };
  }

  async patchItem(
    id: number,
    key: string,
    body: {
      estado: EstadoItemDotacion;
      cantidadEncontrada?: number;
      fechaVencObservada?: string;
      observacion?: string;
    },
  ) {
    const usuario = getUser();
    const now = new Date();
    await this.vencimientoService.ensureResolvedBeforeUse({ dotacionId: id }, now);
    await this.txManager.transactional(async () => {
      await this.dotacionRepo.bloquear(id);
      const dot = await this.dotacionRepo.findById(id);
      if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
      const plantilla = await this.plantillaRepo.findById(dot.getPlantillaId.getValor);
      const itemPlantilla = findPlantillaItem(plantilla.getEstructura as PlantillaEstructuraJson, key);
      dot.guardarItem(key, body, itemPlantilla?.cantidadEsperada, usuario.id, now);
      await this.dotacionRepo.update(dot);
    });
    return { key, diferencia: null };
  }

  async cerrar(id: number, confirmarIncompleto?: boolean): Promise<DotacionView> {
    const usuario = getUser();
    const now = new Date();
    await this.vencimientoService.ensureResolvedBeforeUse({ dotacionId: id }, now);
    await this.txManager.transactional(async () => {
      await this.dotacionRepo.bloquear(id);
      const dot = await this.dotacionRepo.findById(id);
      if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
      dot.assertResponsable(usuario.id);
      dot.cerrar(now, confirmarIncompleto);
      await this.dotacionRepo.update(dot);
      await this.novedadSync.sincronizar(dot, now);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.DOTACION,
        entidadId: id,
        tipoEvento: 'DOTACION_CERRADA',
        usuarioId: usuario.id,
        vehiculoId: dot.getVehiculoId.getValor,
        detalle: { completa: dot.getCompleta },
      });
    });
    await this.programacion.sincronizar(now);
    return this.getById(id);
  }

  async reabrir(id: number): Promise<DotacionView> {
    const usuario = getUser();
    const now = new Date();
    await this.vencimientoService.ensureResolvedBeforeUse({ dotacionId: id }, now);
    await this.txManager.transactional(async () => {
      await this.dotacionRepo.bloquear(id);
      const dot = await this.dotacionRepo.findById(id);
      if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
      dot.assertResponsable(usuario.id);
      dot.reabrir(now);
      await this.dotacionRepo.update(dot);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.DOTACION,
        entidadId: id,
        tipoEvento: 'DOTACION_REABIERTA',
        usuarioId: usuario.id,
        vehiculoId: dot.getVehiculoId.getValor,
      });
    });
    await this.programacion.sincronizar(now);
    return this.getById(id);
  }

  async eliminar(id: number): Promise<void> {
    const usuario = getUser();
    const dot = await this.dotacionRepo.findById(id);
    if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
    dot.assertResponsable(usuario.id);
    if (dot.getEstado !== EstadoDotacion.EN_CURSO || dot.getYaGuardada) {
      throw new BadInputError('No se puede eliminar esta verificación');
    }
    await this.dotacionRepo.delete(id);
    await this.programacion.sincronizar();
  }

  async correccion(
    id: number,
    motivo: string,
    cambios: Array<{
      key: string;
      estado: EstadoItemDotacion;
      cantidadEncontrada?: number;
      fechaVencObservada?: string;
      observacion?: string;
    }>,
  ): Promise<DotacionView> {
    const usuario = getUser();
    const now = new Date();
    await this.txManager.transactional(async () => {
      await this.dotacionRepo.bloquear(id);
      const dot = await this.dotacionRepo.findById(id);
      if (!dot) throw new ResourceNotFoundError('Dotación no encontrada');
      const plantilla = dot.getPlantillaId
        ? await this.plantillaRepo.findById(dot.getPlantillaId.getValor)
        : null;
      const estructura = plantilla?.getEstructura as PlantillaEstructuraJson | undefined;
      const diff = dot.aplicarCorreccionRevisar(
        cambios.map(c => ({
          key: c.key,
          patch: {
            estado: c.estado,
            cantidadEncontrada: c.cantidadEncontrada,
            fechaVencObservada: c.fechaVencObservada,
            observacion: c.observacion,
          },
          cantidadEsperada: estructura
            ? findPlantillaItem(estructura, c.key)?.cantidadEsperada
            : undefined,
        })),
        now,
      );
      await this.dotacionRepo.update(dot);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.DOTACION,
        entidadId: id,
        tipoEvento: 'DOTACION_CORREGIDA',
        usuarioId: usuario.id,
        motivo,
        detalle: { cambios: diff },
        vehiculoId: dot.getVehiculoId.getValor,
      });
      await this.novedadSync.sincronizar(dot, now, { usuarioId: usuario.id, motivo });
    });
    return this.getById(id);
  }

  async listarVencimientos(vehiculoId: number) {
    const amb = await this.ambRepo.findByVehiculoId(vehiculoId);
    if (!amb) throw new ResourceNotFoundError('Ambulancia no registrada');
    const formato =
      amb.getTipoAmbulancia === 'TAB' ? FormatoPlantilla.DOTACION_TAB : FormatoPlantilla.DOTACION_TAM;
    const plantilla = await this.plantillaRepo.findVigenteByFormato(formato);
    const vencs = await this.vencRepo.findByVehiculo(vehiculoId);
    const map = new Map(vencs.map(v => [v.getItemKey, v]));
    const flat = plantilla
      ? flattenPlantillaEstructura(plantilla.getEstructura as PlantillaEstructuraJson)
      : [];
    return Promise.all(
      flat.map(async f => {
        const v = map.get(f.key);
        return {
          itemKey: f.key,
          texto: f.texto,
          categoria: f.categoria,
          cantidadEsperada: f.cantidadEsperada,
          fechaVencimiento: v?.getFechaVencimiento ?? null,
          actualizadoPor: v
            ? await this.usuarioLite(v.getActualizadoPorId.getValor, new Map())
            : undefined,
          updatedAt: v ? v.getUpdatedAt.toISOString() : undefined,
        };
      }),
    );
  }

  private enServicioA2359(
    eventos: Array<{ tipoEvento: string; createdAt: Date }>,
    fecha: string,
  ): boolean {
    const corte = finDiaBogota(fecha);
    const aplicables = eventos
      .filter(e => e.createdAt.getTime() <= corte.getTime())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (!aplicables.length) return true;
    const ultimo = aplicables[aplicables.length - 1];
    return ultimo.tipoEvento !== 'FUERA_SERVICIO';
  }

  private resumenGrilla(dias: DotacionGrillaFilaRead['dias']) {
    const empty = {
      COMPLETA: 0,
      INCOMPLETA_MANUAL: 0,
      INCOMPLETA_VENCIDA: 0,
      EN_CURSO: 0,
      SIN_VERIFICAR: 0,
      FUERA_SERVICIO: 0,
      PENDIENTE_INICIAR: 0,
    };
    for (const d of dias) empty[d.resultado] += 1;
    const evaluables =
      empty.COMPLETA +
      empty.INCOMPLETA_MANUAL +
      empty.INCOMPLETA_VENCIDA +
      empty.EN_CURSO +
      empty.SIN_VERIFICAR;
    return {
      ...empty,
      cumplimientoPct: evaluables === 0 ? null : Math.round((empty.COMPLETA / evaluables) * 100),
    };
  }
}
