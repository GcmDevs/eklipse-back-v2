import { Inject, Injectable } from '@nestjs/common';
import { LecturaOdometro, Vehiculo } from '@inn/operaciones/tanqueos/domain/entities';
import { FuenteLecturaOdometro } from '@inn/operaciones/tanqueos/domain/enums';
import { umbralSaltoKilometraje } from '@inn/operaciones/tanqueos/domain/policies';
import { LecturaOdometroRead } from '@inn/operaciones/tanqueos/domain/reads';
import {
  LECTURA_ODOMETRO_REPOSITORY,
  LecturaOdometroRepository,
  TANQUEO_EVENTO_LOG_REPOSITORY,
  TanqueoEventoLogRepository,
  VEHICULO_REPOSITORY,
  VehiculoRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { TanqueoEventoLog } from '@inn/operaciones/tanqueos/domain/entities';
import { FindThrowOptions } from '@common/domain/types';
import { ResourceNotFoundError } from '@common/domain/errors';

@Injectable()
export class OdometroService {
  constructor(
    @Inject(LECTURA_ODOMETRO_REPOSITORY)
    private readonly lecturas: LecturaOdometroRepository,
    @Inject(VEHICULO_REPOSITORY)
    private readonly vehiculos: VehiculoRepository,
    @Inject(TANQUEO_EVENTO_LOG_REPOSITORY)
    private readonly eventoLogRepository: TanqueoEventoLogRepository
  ) {}

  async referenciaKm(activoId: number): Promise<number | null> {
    return this.lecturas.findLatestConfiableKm(activoId);
  }

  async referenciaKmAntesDelTanqueo(
    activoId: number,
    fechaTanqueo: Date,
    tanqueoId?: number | null
  ): Promise<number | null> {
    return this.lecturas.findLatestConfiableKmAntesDelTanqueo(
      activoId,
      fechaTanqueo,
      tanqueoId
    );
  }

  umbralSalto(activo: Vehiculo, rendimientoEsperado?: number | null): number {
    return umbralSaltoKilometraje(
      activo.getCapacidadAlmacenamientoCombustible,
      rendimientoEsperado ?? null
    );
  }

  isConfiable(kmReportado: number, referenciaKm: number | null, umbral: number): boolean {
    if (referenciaKm == null) return true;
    if (kmReportado < referenciaKm) return false;
    return kmReportado - referenciaKm <= umbral;
  }

  async registerLecturaTanqueo(input: {
    activoId: number;
    tanqueoId: number;
    lectura: number;
    fechaLectura: Date;
    usuarioId: number;
    confiable: boolean;
    observacion?: string | null;
  }): Promise<LecturaOdometro> {
    const lectura = LecturaOdometro.create({
      activoId: input.activoId,
      lectura: input.lectura,
      fechaLectura: input.fechaLectura,
      fuente: FuenteLecturaOdometro.TANQUEO,
      usuarioId: input.usuarioId,
      confiable: input.confiable,
      referenciaId: input.tanqueoId,
      observacion: input.observacion,
    });
    const saved = await this.lecturas.save(lectura);
    await this.recalcReferencia(input.activoId);
    return saved;
  }

  async registerAjuste(input: {
    activoId: number;
    lectura: number;
    fechaLectura: Date;
    usuarioId: number;
    observacion: string;
    confiable: boolean;
    referenciaId?: number | null;
  }): Promise<LecturaOdometro> {
    const ajuste = LecturaOdometro.create({
      ...input,
      fuente: FuenteLecturaOdometro.AJUSTE,
    });
    const saved = await this.lecturas.save(ajuste);
    await this.eventoLogRepository.save(
      TanqueoEventoLog.createAjusteOdometro({
        activoId: input.activoId,
        usuarioId: input.usuarioId,
        observacion: input.observacion,
      })
    );
    await this.recalcReferencia(input.activoId);
    return saved;
  }

  async getHistory(
    activoId: number,
    page: number,
    limit: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<[LecturaOdometroRead[], number]> {
    const exists = await this.vehiculos.exists(activoId);
    if (!exists && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Vehículo con id: ${activoId} no encontrado`);
    }
    if (!exists) return [[], 0];
    return this.lecturas.findHistoryByActivo(activoId, page, limit);
  }

  async recalcReferencia(activoId: number): Promise<number | null> {
    const km = await this.lecturas.findLatestConfiableKm(activoId);
    const activo = await this.vehiculos.findById(activoId);
    if (!activo) return km;
    activo.applyReferenciaOdometro(km);
    await this.vehiculos.update(activo);
    return km;
  }
}
