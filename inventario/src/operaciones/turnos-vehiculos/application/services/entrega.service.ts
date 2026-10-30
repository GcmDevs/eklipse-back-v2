import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import {
  EntregaDeclaracion,
  EntregaFlota,
  TurnoFlota,
} from '@inn/operaciones/turnos-vehiculos/domain/entities';
import {
  CausaCierreEntrega,
  CausaCierreLimpieza,
  CausaCierreTurno,
  EntidadEventoFlota,
  EstadoTurno,
  FormatoPlantilla,
  OrigenTurno,
  RolDeclaracion,
} from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { DeclaracionView, EntregaView, IniciarRecepcionResultView, TurnoView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { seedEntregaItemsFromPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import {
  ENTREGA_DECL_FLOTA_REPOSITORY,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaDeclFlotaRepository,
  EntregaFlotaRepository,
  LIMPIEZA_FLOTA_REPOSITORY,
  LimpiezaFlotaRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { FlotaViewBuilderService } from '../helpers/flota-view-builder.service';
import { AmbEventoService } from './amb-evento.service';
import { VencimientoService } from './vencimiento.service';
import { VencimientoProgramacionService } from './vencimiento-programacion.service';

@Injectable()
export class EntregaService {
  constructor(
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(ENTREGA_DECL_FLOTA_REPOSITORY) private readonly declRepo: EntregaDeclFlotaRepository,
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(LIMPIEZA_FLOTA_REPOSITORY) private readonly limpiezaRepo: LimpiezaFlotaRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly viewBuilder: FlotaViewBuilderService,
    private readonly vencimientoService: VencimientoService,
    private readonly programacion: VencimientoProgramacionService,
    private readonly eventoService: AmbEventoService,
  ) {}

  async getEntrega(id: number): Promise<EntregaView> {
    return this.viewBuilder.buildEntregaView(id);
  }

  async lanzar(turnoId: number): Promise<EntregaView> {
    const usuario = getUser();
    const now = new Date();
    const turno = await this.turnoRepo.findById(turnoId);
    if (!turno) throw new ResourceNotFoundError('Turno no encontrado');
    turno.assertActivo();
    turno.assertResponsable(usuario.id);
    const entrega = await this.entregaRepo.findByTurnoSaliente(turnoId);
    if (!entrega) throw new ResourceNotFoundError('Entrega no encontrada');
    await this.vencimientoService.ensureResolvedBeforeUse({ entregaId: entrega.getId.getValor }, now);
    const borrador = await this.limpiezaRepo.findBorradorByTurno(turnoId);
    if (borrador) throw new BadInputError('Finalice o descarte la limpieza en borrador');
    const plantilla = await this.plantillaRepo.findById(entrega.getPlantillaId.getValor);
    const datos = { items: seedEntregaItemsFromPlantilla(plantilla.getEstructura as PlantillaEstructuraJson) };
    const entregaId = await this.txManager.transactional(async () => {
      entrega.lanzarEntrega(now);
      await this.entregaRepo.update(entrega);
      const decl = EntregaDeclaracion.createEntrega(entrega.getId.getValor, usuario.id, datos);
      await this.declRepo.save(decl);
      turno.marcarEntregado();
      await this.turnoRepo.update(turno);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGA,
        entidadId: entrega.getId.getValor,
        tipoEvento: 'ENTREGA_LANZADA',
        usuarioId: usuario.id,
        vehiculoId: turno.getVehiculoId.getValor,
      });
      return entrega.getId.getValor;
    });
    await this.programacion.sincronizar(now);
    return this.viewBuilder.buildEntregaView(entregaId);
  }

  async iniciarRecepcion(entregaId: number): Promise<IniciarRecepcionResultView> {
    const usuario = getUser();
    const now = new Date();
    await this.vencimientoService.ensureResolvedBeforeUse({ entregaId }, now);
    const entrega = await this.entregaRepo.findById(entregaId);
    if (!entrega) throw new ResourceNotFoundError('Entrega no encontrada');
    const turnoSaliente = await this.turnoRepo.findById(entrega.getTurnoSalienteId.getValor);
    if (!turnoSaliente) throw new ResourceNotFoundError('Turno saliente no encontrado');
    if (turnoSaliente.getResponsableId.getValor === usuario.id) {
      throw new BadInputError('Quien recibe no puede ser quien entregó');
    }
    const excepcional = entrega.puedeRecibirExcepcional(now);
    const normal = entrega.puedeRecibirNormal(now);
    if (!normal && !excepcional) throw new BadInputError('No puede iniciar recepción en este momento');
    const declEntrega = await this.declRepo.findByEntregaAndRol(entregaId, RolDeclaracion.ENTREGA);
    if (normal && !declEntrega) throw new BadInputError('La entrega no fue lanzada');
    const turnoVigente = await this.turnoRepo.findVigenteByResponsable(usuario.id);
    TurnoFlota.assertSinTurnoVigente(turnoVigente);
    const plantilla = await this.plantillaRepo.findVigenteByFormato(FormatoPlantilla.ENTREGA);
    const datos = {
      items: seedEntregaItemsFromPlantilla(plantilla.getEstructura as PlantillaEstructuraJson),
    };
    const nuevoTurnoId = await this.txManager.transactional(async () => {
      const declRecep = EntregaDeclaracion.createRecepcion(entregaId, usuario.id, datos);
      await this.declRepo.save(declRecep);
      const causa = excepcional && !normal ? CausaCierreTurno.REEMPLAZADO_EXCEPCIONAL : CausaCierreTurno.RECEPCION_INICIADA;
      turnoSaliente.cerrar(causa);
      await this.turnoRepo.update(turnoSaliente);
      await this.vencimientoService.resolverBorradoresLimpieza(
        turnoSaliente.getId.getValor,
        CausaCierreLimpieza.VENCIMIENTO,
        now,
      );
      const origen = excepcional && !normal ? OrigenTurno.RECEPCION_EXCEPCIONAL : OrigenTurno.RECEPCION;
      const turnoEntrante =
        origen === OrigenTurno.RECEPCION_EXCEPCIONAL
          ? TurnoFlota.createRecepcion(turnoSaliente.getVehiculoId.getValor, usuario.id, OrigenTurno.RECEPCION_EXCEPCIONAL)
          : TurnoFlota.createRecepcion(turnoSaliente.getVehiculoId.getValor, usuario.id, OrigenTurno.RECEPCION);
      const turnoSaved = await this.turnoRepo.save(turnoEntrante);
      const nuevaEntrega = EntregaFlota.createAbierta(
        turnoSaved.getVehiculoId.getValor,
        turnoSaved.getId.getValor,
        plantilla.getId.getValor,
        turnoSaved.getFechaInicio,
      );
      const entregaNueva = await this.entregaRepo.save(nuevaEntrega);
      entrega.vincularTurnoEntrante(turnoSaved.getId.getValor);
      entrega.cerrar(
        excepcional && !normal ? CausaCierreEntrega.RECEPCION_EXCEPCIONAL : CausaCierreEntrega.COMPLETADA,
        now,
      );
      await this.entregaRepo.update(entrega);
      if (declEntrega) {
        await this.declRepo.bloquear(declEntrega.getId.getValor);
        const declSaliente = await this.declRepo.findById(declEntrega.getId.getValor);
        if (declSaliente?.programarLimiteEdicion(now)) await this.declRepo.update(declSaliente);
      }
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGA,
        entidadId: entregaId,
        tipoEvento: 'RECEPCION_INICIADA',
        usuarioId: usuario.id,
        vehiculoId: turnoSaliente.getVehiculoId.getValor,
      });
      return { turnoId: turnoSaved.getId.getValor, entregaNuevaId: entregaNueva.getId.getValor };
    });
    await this.programacion.sincronizar(now);
    const [turnoView, entregaNuevaView, entregaRecibidaView] = await Promise.all([
      this.viewBuilder.buildTurnoView(nuevoTurnoId.turnoId),
      this.viewBuilder.buildEntregaView(nuevoTurnoId.entregaNuevaId),
      this.viewBuilder.buildEntregaView(entregaId),
    ]);
    return {
      turno: turnoView,
      entregaRecibida: entregaRecibidaView,
      entregaNueva: entregaNuevaView,
      entrega: entregaNuevaView,
    };
  }

  async patchItem(
    entregaId: number,
    rol: RolDeclaracion,
    key: string,
    body: { respuesta: string; observacion?: string | null; evidencias?: number[] },
  ) {
    const usuario = getUser();
    const now = new Date();
    await this.vencimientoService.ensureResolvedBeforeUse({ entregaId }, now);
    return this.txManager.transactional(async () => {
      const decl = await this.declRepo.findByEntregaAndRol(entregaId, rol);
      if (!decl) throw new ResourceNotFoundError('Declaración no encontrada');
      await this.declRepo.bloquear(decl.getId.getValor);
      const lockedDecl = await this.declRepo.findById(decl.getId.getValor);
      if (!lockedDecl) throw new ResourceNotFoundError('Declaración no encontrada');
      await this.vencimientoService.ensureResolvedBeforeUse({ declId: lockedDecl.getId.getValor }, now);
      lockedDecl.updateItem(key, body, now, usuario.id);
      await this.declRepo.update(lockedDecl);
      return this.viewBuilder.buildDeclaracionView(entregaId, rol);
    });
  }

  async cerrarDeclaracion(
    entregaId: number,
    rol: RolDeclaracion,
    confirmarIncompleto?: boolean,
  ): Promise<DeclaracionView> {
    const usuario = getUser();
    const now = new Date();
    await this.txManager.transactional(async () => {
      const actual = await this.declRepo.findByEntregaAndRol(entregaId, rol);
      if (!actual) throw new ResourceNotFoundError('Declaración no encontrada');
      const declId = actual.getId.getValor;
      await this.declRepo.bloquear(declId);
      await this.vencimientoService.ensureResolvedBeforeUse({ declId }, now);
      const decl = await this.declRepo.findById(declId);
      if (!decl) throw new ResourceNotFoundError('Declaración no encontrada');
      decl.cerrarManual(!!confirmarIncompleto, now, usuario.id);
      await this.declRepo.update(decl);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGADECL,
        entidadId: declId,
        tipoEvento: 'DECLARACION_CERRADA',
        usuarioId: usuario.id,
      });
    });
    await this.programacion.sincronizar(now);
    return this.viewBuilder.buildDeclaracionView(entregaId, rol);
  }

  async correccionDeclaracion(
    entregaId: number,
    rol: RolDeclaracion,
    motivo: string,
    cambios: Array<{ key: string; respuesta: string; observacion?: string; evidencias?: number[] }>,
  ): Promise<DeclaracionView> {
    const usuario = getUser();
    const now = new Date();
    const decl = await this.declRepo.findByEntregaAndRol(entregaId, rol);
    if (!decl) throw new ResourceNotFoundError('Declaración no encontrada');
    const diff = decl.aplicarCorreccionRevisar(
      cambios.map(c => ({
        key: c.key,
        patch: { respuesta: c.respuesta as any, observacion: c.observacion, evidencias: c.evidencias },
      })),
      now,
    );
    await this.declRepo.update(decl);
    await this.eventoService.registrar({
      entidad: EntidadEventoFlota.ENTREGADECL,
      entidadId: decl.getId.getValor,
      tipoEvento: 'DECLARACION_CORREGIDA',
      usuarioId: usuario.id,
      motivo,
      detalle: { cambios: diff },
    });
    return this.viewBuilder.buildDeclaracionView(entregaId, rol);
  }
}
