import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { INN_AUTHORITIES } from '@inn/authorities';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { ConflictError, ForbiddenAccessError, ResourceNotFoundError } from '@common/domain/errors';
import { fetchAuthsByUser, getUser } from '@common/infrastructure/services';
import { LimpiezaFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota, EstadoLimpieza, EstadoTurno, FormatoPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { LimpiezaView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { flattenPlantillaLimpiezaPorTipo, seedLimpiezaItemsFromPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import {
  LIMPIEZA_FLOTA_REPOSITORY,
  LimpiezaFlotaRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { FlotaSearchService } from '../helpers/flota-search.service';
import { AmbEventoService } from './amb-evento.service';

@Injectable()
export class LimpiezaService {
  constructor(
    @Inject(LIMPIEZA_FLOTA_REPOSITORY) private readonly limpiezaRepo: LimpiezaFlotaRepository,
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly eventoService: AmbEventoService,
    private readonly searchService: FlotaSearchService,
  ) {}

  async crearBorrador(turnoId: number): Promise<LimpiezaView> {
    const usuario = getUser();
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno || turno.getEstado !== EstadoTurno.ACTIVO) {
      throw new ResourceNotFoundError('Turno no activo');
    }
    const borrador = await this.limpiezaRepo.findBorradorByTurno(turnoId);
    if (borrador) throw new ConflictError('Ya existe una limpieza en borrador para este turno');
    const plantilla = await this.plantillaRepo.findVigenteByFormato(FormatoPlantilla.LIMPIEZA);
    const datos = { items: seedLimpiezaItemsFromPlantilla(plantilla.getEstructura as PlantillaEstructuraJson, 'AMBULANCIA') };
    const id = await this.txManager.transactional(async () => {
      const l = LimpiezaFlota.createBorrador(
        turnoId,
        turno.getVehiculoId.getValor,
        plantilla.getId.getValor,
        usuario.id,
        datos,
      );
      const saved = await this.limpiezaRepo.save(l);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.LIMPIEZA,
        entidadId: saved.getId.getValor,
        tipoEvento: 'LIMPIEZA_BORRADOR',
        usuarioId: usuario.id,
        vehiculoId: turno.getVehiculoId.getValor,
      });
      return saved.getId.getValor;
    });
    return this.toView(id);
  }

  async getById(id: number): Promise<LimpiezaView> {
    return this.toView(id);
  }

  async search(params: {
    search?: string;
    vehiculoId?: number;
    turnoId?: number;
    estado?: EstadoLimpieza;
    desde?: string;
    hasta?: string;
    page: number;
    limit: number;
  }): Promise<[LimpiezaView[], number]> {
    const searchScope = await this.searchService.resolveScope(params.search);
    const [rows, total] = await this.limpiezaRepo.search({
      vehiculoId: params.vehiculoId,
      turnoId: params.turnoId,
      estado: params.estado,
      desde: params.desde ? new Date(params.desde) : undefined,
      hasta: params.hasta ? new Date(params.hasta) : undefined,
      page: params.page,
      pageSize: params.limit,
      searchScope,
    });
    const items: LimpiezaView[] = [];
    for (const row of rows) {
      items.push(await this.toView(row.getId.getValor));
    }
    return [items, total];
  }

  async patchMeta(id: number, reproceso: boolean | null): Promise<LimpiezaView> {
    const usuario = getUser();
    const l = await this.limpiezaRepo.findById(id);
    if (!l) throw new ResourceNotFoundError('Limpieza no encontrada');
    l.setReproceso(reproceso, usuario.id);
    await this.limpiezaRepo.update(l);
    return this.toView(id);
  }

  async patchItem(
    id: number,
    key: string,
    body: { respuesta: 'C' | 'NC' | null; observacion?: string | null; evidencias?: number[] },
  ) {
    const usuario = getUser();
    await this.txManager.transactional(async () => {
      await this.limpiezaRepo.bloquear(id);
      const l = await this.limpiezaRepo.findById(id);
      if (!l) throw new ResourceNotFoundError('Limpieza no encontrada');
      l.updateItem(key, body, usuario.id, 'AMBULANCIA');
      await this.limpiezaRepo.update(l);
    });
    const view = await this.toView(id);
    return { ...view.items.find(i => i.key === key), totalNc: view.totalNc };
  }

  async finalizar(id: number, confirmarIncompleto?: boolean): Promise<LimpiezaView> {
    const usuario = getUser();
    await this.txManager.transactional(async () => {
      await this.limpiezaRepo.bloquear(id);
      const l = await this.limpiezaRepo.findById(id);
      if (!l) throw new ResourceNotFoundError('Limpieza no encontrada');
      l.finalizar(!!confirmarIncompleto, new Date(), usuario.id, 'AMBULANCIA');
      await this.limpiezaRepo.update(l);
    });
    return this.toView(id);
  }

  async descartar(id: number): Promise<void> {
    const usuario = getUser();
    await this.txManager.transactional(async () => {
      await this.limpiezaRepo.bloquear(id);
      const l = await this.limpiezaRepo.findById(id);
      if (!l || l.getEstado !== EstadoLimpieza.BORRADOR) {
        throw new ResourceNotFoundError('Solo se puede descartar borrador');
      }
      if (l.getUsuarioId.getValor !== usuario.id && !(await this.esAdministrador(usuario))) {
        throw new ForbiddenAccessError('Solo el responsable puede descartar esta limpieza');
      }
      await this.limpiezaRepo.delete(id);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.LIMPIEZA,
        entidadId: id,
        tipoEvento: 'LIMPIEZA_DESCARTADA',
        usuarioId: usuario.id,
        vehiculoId: l.getVehiculoId.getValor,
        detalle: { motivo: 'MANUAL' },
      });
    });
  }

  private async esAdministrador(usuario: { id: number; context: any }): Promise<boolean> {
    const auths = await fetchAuthsByUser({ id: usuario.id, ctx: usuario.context });
    const codes: string[] = auths.onlyCodes ?? [];
    return codes.includes(INN_AUTHORITIES.GESTION_FLOTA.ADMINISTRAR) || codes.includes(ADMIN_AUTHORITY);
  }

  async correccion(
    id: number,
    motivo: string,
    cambios: Array<{ key: string; respuesta?: 'C' | 'NC' | null; observacion?: string; evidencias?: number[] }>,
    reproceso?: boolean | null,
  ): Promise<LimpiezaView> {
    const usuario = getUser();
    const now = new Date();
    const l = await this.limpiezaRepo.findById(id);
    if (!l) throw new ResourceNotFoundError('Limpieza no encontrada');
    const diff = l.aplicarCorreccionRevisar(
      cambios.map(c => ({ key: c.key, patch: { respuesta: c.respuesta, observacion: c.observacion, evidencias: c.evidencias } })),
      reproceso,
      now,
      'AMBULANCIA',
    );
    await this.limpiezaRepo.update(l);
    await this.eventoService.registrar({
      entidad: EntidadEventoFlota.LIMPIEZA,
      entidadId: id,
      tipoEvento: 'LIMPIEZA_CORREGIDA',
      usuarioId: usuario.id,
      motivo,
      detalle: { cambios: diff },
      vehiculoId: l.getVehiculoId.getValor,
    });
    return this.toView(id);
  }

  private async toView(id: number): Promise<LimpiezaView> {
    const l = await this.limpiezaRepo.findById(id);
    if (!l) throw new ResourceNotFoundError('Limpieza no encontrada');
    const plantilla = l.getPlantillaId
      ? await this.plantillaRepo.findById(l.getPlantillaId.getValor)
      : null;
    const flat = plantilla
      ? flattenPlantillaLimpiezaPorTipo(plantilla.getEstructura as PlantillaEstructuraJson, 'AMBULANCIA')
      : [];
    const items = flat.map(f => {
      const i = l.getDatos?.items.find(x => x.key === f.key);
      return {
        key: f.key,
        texto: f.texto,
        categoria: f.categoria,
        orden: f.orden,
        respuesta: i?.respuesta ?? null,
        observacion: i?.observacion,
        evidencias: i?.evidencias,
      };
    });
    const pendientes = items.filter(i => i.respuesta === null).length;
    return {
      id: l.getId.getValor,
      turnoId: l.getTurnoId.getValor,
      estado: l.getEstado,
      causaCierre: l.getCausaCierre,
      usuario: l.getUsuarioId ? { id: l.getUsuarioId.getValor, nombre: '' } : null,
      reproceso: l.getReproceso,
      totalNc: l.getTotalNc,
      pendientes,
      fechaFinalizacion: l.getFechaFinalizacion,
      items,
    };
  }
}
