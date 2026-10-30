import { Inject, Injectable } from '@nestjs/common';
import { EstadoEntrega, EstadoTurno } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { fechaNegocioBogota } from '@inn/operaciones/turnos-vehiculos/domain/helpers/bogota-time.helper';
import {
  AmbulanciaFueraServicioView,
  AmbulanciaSinTurnoView,
  DotacionHoyRead,
  TableroView,
  TurnoTableroView,
} from '@inn/operaciones/turnos-vehiculos/domain/read';
import {
  AMBULANCIA_FLOTA_REPOSITORY,
  AmbulanciaFlotaRepository,
  DOTACION_FLOTA_REPOSITORY,
  DOTACION_NOVEDAD_REPOSITORY,
  DotacionFlotaRepository,
  DotacionNovedadRepository,
  ENTREGA_FLOTA_REPOSITORY,
  EntregaFlotaRepository,
  EVENTO_FLOTA_REPOSITORY,
  EventoFlotaRepository,
  TURNO_FLOTA_REPOSITORY,
  TurnoFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { VehiculosService } from '@inn/operaciones/tanqueos/application';
import { resolveVehiculoDisplay } from '../helpers/vehiculo-display.helper';
import { FlotaViewBuilderService } from '../helpers/flota-view-builder.service';

@Injectable()
export class TableroService {
  constructor(
    @Inject(TURNO_FLOTA_REPOSITORY) private readonly turnoRepo: TurnoFlotaRepository,
    @Inject(AMBULANCIA_FLOTA_REPOSITORY) private readonly ambRepo: AmbulanciaFlotaRepository,
    @Inject(DOTACION_FLOTA_REPOSITORY) private readonly dotacionRepo: DotacionFlotaRepository,
    @Inject(DOTACION_NOVEDAD_REPOSITORY) private readonly novedadRepo: DotacionNovedadRepository,
    @Inject(ENTREGA_FLOTA_REPOSITORY) private readonly entregaRepo: EntregaFlotaRepository,
    @Inject(EVENTO_FLOTA_REPOSITORY) private readonly eventoRepo: EventoFlotaRepository,
    private readonly viewBuilder: FlotaViewBuilderService,
    private readonly vehiculoService: VehiculosService,
  ) {}

  async obtener(): Promise<TableroView> {
    const now = new Date();
    const fecha = fechaNegocioBogota(now);

    const turnos = await this.turnoRepo.findActivosOrdered();
    const turnoIds = turnos.map(t => t.getId.getValor);
    const entregas = await this.entregaRepo.findByTurnoSalienteIds(turnoIds);
    const entregaByTurno = new Map(entregas.map(e => [e.getTurnoSalienteId.getValor, e]));

    const dotacionesHoy = await this.dotacionRepo.findByFecha(fecha);
    const dotacionByVehiculo = new Map(dotacionesHoy.map(d => [d.getVehiculoId.getValor, d]));
    const novedadCounts = await this.novedadRepo.countByDotacionIds(dotacionesHoy.map(d => d.getId.getValor));

    const dotacionHoyFor = (vehiculoId: number): DotacionHoyRead | null => {
      const d = dotacionByVehiculo.get(vehiculoId);
      if (!d) return null;
      const c = novedadCounts.get(d.getId.getValor);
      return {
        id: d.getId.getValor,
        estado: d.getEstado,
        completa: d.getCompleta,
        novedadesAbiertas: c?.abiertas ?? 0,
      };
    };

    const turnosActivos: TurnoTableroView[] = [];
    for (const t of turnos) {
      const view = await this.viewBuilder.buildTurnoView(t.getId.getValor);
      turnosActivos.push({
        ...view,
        dotacionHoy: dotacionHoyFor(t.getVehiculoId.getValor),
      });
    }

    const sinTurnoAmbs = await this.ambRepo.findEnServicioSinTurnoActivo();
    const ultimosFin = await this.turnoRepo.findUltimaFechaFinByVehiculos(
      sinTurnoAmbs.map(a => a.getVehiculoId.getValor),
    );
    const ambulanciasSinTurno: AmbulanciaSinTurnoView[] = [];
    for (const amb of sinTurnoAmbs) {
      const display = await resolveVehiculoDisplay(this.vehiculoService, amb.getVehiculoId.getValor);
      const fin = ultimosFin.get(amb.getVehiculoId.getValor);
      ambulanciasSinTurno.push({
        id: amb.getId.getValor,
        vehiculoId: amb.getVehiculoId.getValor,
        placa: display.placa,
        codigo: display.codigo,
        tipoAmbulancia: amb.getTipoAmbulancia,
        estadoServicio: amb.getEstadoServicio,
        turnoActivo: null,
        ultimoTurnoFin: fin ? fin.toISOString() : null,
        dotacionHoy: dotacionHoyFor(amb.getVehiculoId.getValor),
      });
    }

    const fueraAmbs = await this.ambRepo.findFueraServicio();
    const eventosFuera = await this.eventoRepo.findUltimosFueraServicioByAmbulanciaIds(
      fueraAmbs.map(a => a.getId.getValor),
    );
    const ambulanciasFueraServicio: AmbulanciaFueraServicioView[] = [];
    for (const amb of fueraAmbs) {
      const display = await resolveVehiculoDisplay(this.vehiculoService, amb.getVehiculoId.getValor);
      const ev = eventosFuera.get(amb.getId.getValor);
      ambulanciasFueraServicio.push({
        id: amb.getId.getValor,
        vehiculoId: amb.getVehiculoId.getValor,
        placa: display.placa,
        codigo: display.codigo,
        tipoAmbulancia: amb.getTipoAmbulancia,
        estadoServicio: amb.getEstadoServicio,
        turnoActivo: null,
        motivo: ev?.getMotivo ?? '',
        fechaDesde: ev ? ev.getCreatedAt.toISOString() : '',
      });
    }

    let recepcionesPendientes = 0;
    for (const t of turnos) {
      if (t.getEstado !== EstadoTurno.ENTREGADO) continue;
      const e = entregaByTurno.get(t.getId.getValor);
      if (e && e.getEstado === EstadoEntrega.ABIERTA) recepcionesPendientes++;
    }

    const enServicio = await this.ambRepo.countEnServicio();
    const conRegistroHoy = await this.dotacionRepo.countByFecha(fecha);

    return {
      fecha,
      resumen: {
        turnosActivos: turnos.length,
        recepcionesPendientes,
        ambulanciasSinTurno: ambulanciasSinTurno.length,
        ambulanciasFueraServicio: ambulanciasFueraServicio.length,
        novedadesAbiertas: await this.novedadRepo.countAbiertasGlobal(),
        dotacionesSinIniciarHoy: Math.max(0, enServicio - conRegistroHoy),
      },
      turnosActivos,
      ambulanciasSinTurno,
      ambulanciasFueraServicio,
    };
  }
}
