import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { EntregaFlota, TurnoFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota, EstadoTurno, FormatoPlantilla } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { TurnoView } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { FlotaSearchService } from '../helpers/flota-search.service';
import {
  AMBULANCIA_FLOTA_REPOSITORY,
  AmbulanciaFlotaRepository,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaFlotaRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { FlotaViewBuilderService } from '../helpers/flota-view-builder.service';
import { AmbEventoService } from './amb-evento.service';
import { VencimientoProgramacionService } from './vencimiento-programacion.service';

@Injectable()
export class TurnoService {
  constructor(
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(AMBULANCIA_FLOTA_REPOSITORY) private readonly ambRepo: AmbulanciaFlotaRepository,
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly viewBuilder: FlotaViewBuilderService,
    private readonly eventoService: AmbEventoService,
    private readonly programacion: VencimientoProgramacionService,
    private readonly searchService: FlotaSearchService,
  ) {}

  async iniciarTurno(vehiculoId: number): Promise<TurnoView> {
    const usuario = getUser();
    const amb = await this.ambRepo.findByVehiculoId(vehiculoId);
    if (!amb) throw new BadInputError('Ambulancia no registrada');
    amb.assertEnServicio();
    const turnoVigente = await this.turnoRepo.findVigenteByResponsable(usuario.id);
    TurnoFlota.assertSinTurnoVigente(turnoVigente);
    const activo = await this.turnoRepo.findActivoByVehiculo(vehiculoId);
    if (activo) throw new BadInputError('Ya existe un turno activo o entregado');
    const plantilla = await this.plantillaRepo.findVigenteByFormato(FormatoPlantilla.ENTREGA);
    if (!plantilla) throw new BadInputError('No hay plantilla de entrega vigente');

    const view = await this.txManager.transactional(async () => {
      const turno = TurnoFlota.createInicio(vehiculoId, usuario.id);
      const turnoSaved = await this.turnoRepo.save(turno);
      const entrega = EntregaFlota.createAbierta(
        vehiculoId,
        turnoSaved.getId.getValor,
        plantilla.getId.getValor,
        turnoSaved.getFechaInicio,
      );
      const entregaSaved = await this.entregaRepo.save(entrega);
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.TURNO,
        entidadId: turnoSaved.getId.getValor,
        tipoEvento: 'TURNO_INICIADO',
        usuarioId: usuario.id,
        vehiculoId,
      });
      await this.eventoService.registrar({
        entidad: EntidadEventoFlota.ENTREGA,
        entidadId: entregaSaved.getId.getValor,
        tipoEvento: 'ENTREGA_ABIERTA',
        usuarioId: usuario.id,
        vehiculoId,
      });
      return turnoSaved.getId.getValor;
    });
    await this.programacion.sincronizar();
    return this.viewBuilder.buildTurnoView(view);
  }

  async getById(id: number): Promise<TurnoView> {
    return this.viewBuilder.buildTurnoView(id);
  }

  async search(params: {
    search?: string;
    vehiculoId?: number;
    estado?: EstadoTurno;
    desde?: string;
    hasta?: string;
    page: number;
    limit: number;
  }): Promise<[TurnoView[], number]> {
    const searchScope = await this.searchService.resolveScope(params.search);
    const [rows, total] = await this.turnoRepo.search({
      vehiculoId: params.vehiculoId,
      estado: params.estado,
      desde: params.desde ? new Date(params.desde) : undefined,
      hasta: params.hasta ? new Date(params.hasta) : undefined,
      page: params.page,
      pageSize: params.limit,
      searchScope,
    });
    const items: TurnoView[] = [];
    for (const t of rows) {
      items.push(await this.viewBuilder.buildTurnoView(t.getId.getValor));
    }
    return [items, total];
  }
}
