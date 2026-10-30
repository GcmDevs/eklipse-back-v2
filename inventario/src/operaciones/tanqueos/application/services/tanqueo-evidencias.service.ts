import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { StagingFileService } from '@inn/core/media/application/services/staging.archivo.service';
import { Inject, Injectable } from '@nestjs/common';
import { Abastecimiento, Tanqueo, TanqueoEvidenciaLog } from '@inn/operaciones/tanqueos/domain/entities';
import { AccionEvidenciaLog, TipoEvidencia } from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoEvidencia } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import {
  ABASTECIMIENTO_REPOSITORY,
  AbastecimientoRepository,
  TANQUEO_EVIDENCIA_LOG_REPOSITORY,
  TANQUEO_REPOSITORY,
  TanqueoEvidenciaLogRepository,
  TanqueoRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { EvidenciasTanqueo } from '@inn/operaciones/tanqueos/domain/value-objects';

@Injectable()
export class TanqueoEvidenciasService {
  constructor(
    @Inject(TANQUEO_REPOSITORY) private readonly tanqueoRepository: TanqueoRepository,
    @Inject(ABASTECIMIENTO_REPOSITORY)
    private readonly abastecimientoRepository: AbastecimientoRepository,
    @Inject(TANQUEO_EVIDENCIA_LOG_REPOSITORY)
    private readonly evidenciaLogRepository: TanqueoEvidenciaLogRepository,
    @Inject(TRANSACTION_MANAGER) private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService
  ) {}

  async agregarTanqueo(
    tanqueoId: number,
    tipo: TipoEvidencia,
    mediaId: number,
    motivo?: string
  ): Promise<Tanqueo> {
    await this.assertMediaExists(mediaId);
    const tanqueo = await this.findTanqueoOrThrow(tanqueoId);
    const prev = tanqueo.getEvidencias.getEntradas().find(e => e.tipo === tipo);
    const accion =
      prev?.estado === EstadoEvidencia.CAPTURADA
        ? AccionEvidenciaLog.REEMPLAZADA
        : AccionEvidenciaLog.AGREGADA;
    const nuevas = tanqueo.getEvidencias.captureOrReplace(tipo, mediaId, motivo);
    return this.persistTanqueoEvidencias(tanqueo, nuevas, {
      accion,
      tipo,
      mediaAnteriorId: prev?.mediaId ?? null,
      mediaNuevoId: mediaId,
      motivo,
    });
  }

  async eliminarTanqueo(tanqueoId: number, tipo: TipoEvidencia, motivo: string): Promise<Tanqueo> {
    if (!motivo?.trim()) throw new BadInputError('motivo es obligatorio');
    const tanqueo = await this.findTanqueoOrThrow(tanqueoId);
    const prev = tanqueo.getEvidencias.getEntradas().find(e => e.tipo === tipo);
    const nuevas = tanqueo.getEvidencias.remove(tipo);
    return this.persistTanqueoEvidencias(tanqueo, nuevas, {
      accion: AccionEvidenciaLog.ELIMINADA,
      tipo,
      mediaAnteriorId: prev?.mediaId ?? null,
      mediaNuevoId: null,
      motivo,
    });
  }

  async reasignarTanqueo(
    tanqueoId: number,
    tipoOrigen: TipoEvidencia,
    tipoDestino: TipoEvidencia,
    motivo: string
  ): Promise<Tanqueo> {
    const tanqueo = await this.findTanqueoOrThrow(tanqueoId);
    const prev = tanqueo.getEvidencias.getEntradas().find(e => e.tipo === tipoOrigen);
    const nuevas = tanqueo.getEvidencias.reassign(tipoOrigen, tipoDestino, motivo);
    return this.persistTanqueoEvidencias(tanqueo, nuevas, {
      accion: AccionEvidenciaLog.REASIGNADA,
      tipo: tipoOrigen,
      mediaAnteriorId: prev?.mediaId ?? null,
      mediaNuevoId: prev?.mediaId ?? null,
      tipoDestino,
      motivo,
    });
  }

  async reordenarTanqueo(tanqueoId: number, tipos: TipoEvidencia[]): Promise<Tanqueo> {
    const tanqueo = await this.findTanqueoOrThrow(tanqueoId);
    const nuevas = tanqueo.getEvidencias.reorder(tipos);
    tanqueo.replaceEvidencias(nuevas);
    await this.txManager.transactional(async () => {
      await this.tanqueoRepository.update(tanqueo);
    });
    return tanqueo;
  }

  async agregarAbastecimiento(
    abastecimientoId: number,
    tipo: TipoEvidencia,
    mediaId: number,
    motivo?: string
  ): Promise<Abastecimiento> {
    await this.assertMediaExists(mediaId);
    const abast = await this.findAbastecimientoOrThrow(abastecimientoId);
    const prev = abast.getEvidencias.getEntradas().find(e => e.tipo === tipo);
    const accion =
      prev?.estado === EstadoEvidencia.CAPTURADA
        ? AccionEvidenciaLog.REEMPLAZADA
        : AccionEvidenciaLog.AGREGADA;
    const nuevas = abast.getEvidencias.captureOrReplace(tipo, mediaId, motivo);
    return this.persistAbastecimientoEvidencias(abast, nuevas, {
      abastecimientoId,
      accion,
      tipo,
      mediaAnteriorId: prev?.mediaId ?? null,
      mediaNuevoId: mediaId,
      motivo,
    });
  }

  async eliminarAbastecimiento(
    abastecimientoId: number,
    tipo: TipoEvidencia,
    motivo: string
  ): Promise<Abastecimiento> {
    if (!motivo?.trim()) throw new BadInputError('motivo es obligatorio');
    const abast = await this.findAbastecimientoOrThrow(abastecimientoId);
    const prev = abast.getEvidencias.getEntradas().find(e => e.tipo === tipo);
    const nuevas = abast.getEvidencias.remove(tipo);
    return this.persistAbastecimientoEvidencias(abast, nuevas, {
      abastecimientoId,
      accion: AccionEvidenciaLog.ELIMINADA,
      tipo,
      mediaAnteriorId: prev?.mediaId ?? null,
      mediaNuevoId: null,
      motivo,
    });
  }

  async reasignarAbastecimiento(
    abastecimientoId: number,
    tipoOrigen: TipoEvidencia,
    tipoDestino: TipoEvidencia,
    motivo: string
  ): Promise<Abastecimiento> {
    const abast = await this.findAbastecimientoOrThrow(abastecimientoId);
    const prev = abast.getEvidencias.getEntradas().find(e => e.tipo === tipoOrigen);
    const nuevas = abast.getEvidencias.reassign(tipoOrigen, tipoDestino, motivo);
    return this.persistAbastecimientoEvidencias(abast, nuevas, {
      abastecimientoId,
      accion: AccionEvidenciaLog.REASIGNADA,
      tipo: tipoOrigen,
      mediaAnteriorId: prev?.mediaId ?? null,
      mediaNuevoId: prev?.mediaId ?? null,
      tipoDestino,
      motivo,
    });
  }

  async reordenarAbastecimiento(
    abastecimientoId: number,
    tipos: TipoEvidencia[]
  ): Promise<Abastecimiento> {
    const abast = await this.findAbastecimientoOrThrow(abastecimientoId);
    const nuevas = abast.getEvidencias.reorder(tipos);
    abast.replaceEvidencias(nuevas);
    await this.txManager.transactional(async () => {
      await this.abastecimientoRepository.save(abast);
    });
    const refreshed = await this.abastecimientoRepository.findById(abastecimientoId);
    return refreshed ?? abast;
  }

  private async findAbastecimientoOrThrow(id: number): Promise<Abastecimiento> {
    const abast = await this.abastecimientoRepository.findById(id);
    if (!abast) {
      throw new ResourceNotFoundError(`Abastecimiento ${id} no encontrado`);
    }
    return abast;
  }

  private async persistAbastecimientoEvidencias(
    abast: Abastecimiento,
    evidencias: EvidenciasTanqueo,
    log: {
      abastecimientoId: number;
      accion: AccionEvidenciaLog;
      tipo: TipoEvidencia;
      mediaAnteriorId: number | null;
      mediaNuevoId: number | null;
      tipoDestino?: TipoEvidencia;
      motivo?: string;
    }
  ): Promise<Abastecimiento> {
    abast.replaceEvidencias(evidencias);
    await this.txManager.transactional(async () => {
      await this.abastecimientoRepository.save(abast);
      await this.evidenciaLogRepository.save(
        TanqueoEvidenciaLog.create({
          usuarioId: getUser().id,
          abastecimientoId: log.abastecimientoId,
          tipoEvidencia: log.tipo,
          accion: log.accion,
          mediaAnteriorId: log.mediaAnteriorId,
          mediaNuevoId: log.mediaNuevoId,
          tipoDestino: log.tipoDestino ?? null,
          motivo: log.motivo,
        })
      );
    });
    const refreshed = await this.abastecimientoRepository.findById(log.abastecimientoId);
    return refreshed ?? abast;
  }

  private async findTanqueoOrThrow(id: number): Promise<Tanqueo> {
    const tanqueo = await this.tanqueoRepository.findById(id);
    if (!tanqueo) throw new ResourceNotFoundError(`Tanqueo con id: ${id} no encontrado`);
    return tanqueo;
  }

  private async persistTanqueoEvidencias(
    tanqueo: Tanqueo,
    evidencias: EvidenciasTanqueo,
    log: {
      accion: AccionEvidenciaLog;
      tipo: TipoEvidencia;
      mediaAnteriorId: number | null;
      mediaNuevoId: number | null;
      tipoDestino?: TipoEvidencia;
      motivo?: string;
    }
  ): Promise<Tanqueo> {
    tanqueo.replaceEvidencias(evidencias);
    await this.txManager.transactional(async () => {
      await this.tanqueoRepository.update(tanqueo);
      await this.evidenciaLogRepository.save(
        TanqueoEvidenciaLog.create({
          usuarioId: getUser().id,
          tanqueoId: tanqueo.getId.getValor,
          tipoEvidencia: log.tipo,
          accion: log.accion,
          mediaAnteriorId: log.mediaAnteriorId,
          mediaNuevoId: log.mediaNuevoId,
          tipoDestino: log.tipoDestino ?? null,
          motivo: log.motivo,
        })
      );
    });
    const refreshed = await this.tanqueoRepository.findById(tanqueo.getId.getValor);
    return refreshed ?? tanqueo;
  }

  private async assertMediaExists(mediaId: number): Promise<void> {
    const archivo = await this.stagingFileService.findById(mediaId, { throwIfNotFound: false });
    if (!archivo) {
      throw new BadInputError(`El archivo ${mediaId} no existe en almacenamiento`);
    }
  }
}
