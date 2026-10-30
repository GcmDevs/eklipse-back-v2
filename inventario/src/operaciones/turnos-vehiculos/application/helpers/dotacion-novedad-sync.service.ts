import { DotacionFlota, DotacionNovedad } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota, EstadoItemDotacion, EstadoNovedadDotacion } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { findPlantillaItem } from '@inn/operaciones/turnos-vehiculos/domain/policies';
import {
  DOTACION_NOVEDAD_REPOSITORY,
  DotacionNovedadRepository,
  PLANTILLA_FLOTA_REPOSITORY,
  PlantillaFlotaRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { PlantillaEstructuraJson } from '@inn/operaciones/turnos-vehiculos/domain/types';
import { Inject, Injectable } from '@nestjs/common';
import { AmbEventoService } from '../services/amb-evento.service';

/**
 * Sincroniza `AMBDOTACIONNOVEDAD` con el contenido CONFIRMADO de una dotación.
 * Idempotente (índice único dotación + ítem). Debe invocarse dentro de la transacción
 * que persiste el `datoConfirmado`.
 */
@Injectable()
export class DotacionNovedadSyncService {
  constructor(
    @Inject(DOTACION_NOVEDAD_REPOSITORY) private readonly novedadRepo: DotacionNovedadRepository,
    @Inject(PLANTILLA_FLOTA_REPOSITORY) private readonly plantillaRepo: PlantillaFlotaRepository,
    private readonly eventoService: AmbEventoService,
  ) {}

  async sincronizar(
    dot: DotacionFlota,
    now: Date,
    auditoria?: { usuarioId: number; motivo: string },
  ): Promise<void> {
    const items = dot.getDatoConfirmado?.items ?? [];
    const dotacionId = dot.getId.getValor;
    const existentes = new Map(
      (await this.novedadRepo.findByDotacion(dotacionId)).map(n => [n.getItemKey, n]),
    );
    const plantilla = dot.getPlantillaId ? await this.plantillaRepo.findById(dot.getPlantillaId.getValor) : null;
    const estructura = plantilla?.getEstructura as PlantillaEstructuraJson | undefined;

    for (const item of items) {
      const existente = existentes.get(item.key);
      if (item.estado === EstadoItemDotacion.NOVEDAD) {
        if (!existente) {
          await this.novedadRepo.save(
            DotacionNovedad.createAbierta(dotacionId, item.key, {
              cantidadEsperada: estructura ? findPlantillaItem(estructura, item.key)?.cantidadEsperada : undefined,
              cantidadEncontrada: item.cantidadEncontrada ?? undefined,
              fechaVencRegistrada: item.fechaVencRegistrada ?? undefined,
              fechaVencObservada: item.fechaVencObservada ?? undefined,
              observacion: item.observacion ?? '',
            }),
          );
        } else if (existente.getEstado === EstadoNovedadDotacion.INVALIDADA) {
          existente.reabrir(now);
          await this.novedadRepo.update(existente);
          await this.auditar(existente.getId.getValor, 'NOVEDAD_REABIERTA', item.key, 'INVALIDADA', 'ABIERTA', auditoria);
        }
      } else if (existente?.getEstado === EstadoNovedadDotacion.ABIERTA) {
        existente.invalidar(now);
        await this.novedadRepo.update(existente);
        await this.auditar(existente.getId.getValor, 'NOVEDAD_INVALIDADA', item.key, 'ABIERTA', 'INVALIDADA', auditoria);
      }
    }
  }

  private async auditar(
    novedadId: number,
    tipoEvento: string,
    itemKey: string,
    anterior: string,
    nuevo: string,
    auditoria?: { usuarioId: number; motivo: string },
  ): Promise<void> {
    if (!auditoria) return;
    await this.eventoService.registrar({
      entidad: EntidadEventoFlota.NOVEDAD,
      entidadId: novedadId,
      tipoEvento,
      usuarioId: auditoria.usuarioId,
      motivo: auditoria.motivo,
      detalle: { itemKey, anterior, nuevo },
    });
  }
}

