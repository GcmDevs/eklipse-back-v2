import { FILE_LOCATIONS } from '@common/application/file-locations';
import {
  hasDefinedValues,
  TRANSACTION_MANAGER,
  TransactionManager,
} from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { RESTRICCIONES_MIME_STAGING, TipoContextoArchivo } from '@core/media/domain/types';
import { DomainEquipoEvent } from '@equipos/domain/events';
import { EquipoRead } from '@equipos/domain/read';
import { EQUIPOS_REPOSITORY, EquiposRepository } from '@equipos/domain/repositories';
import { AddFotoDto, UpdateFotoDto } from '@equipos/presentation/dto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { generateCorrelationId } from '../helpers';
import { EquiposService } from './equipo.service';

@Injectable()
export class RegFotograficoEquiposService {
  constructor(
    @Inject(EQUIPOS_REPOSITORY)
    private readonly equipoRepository: EquiposRepository,
    private readonly equiposService: EquiposService,
    private readonly stagingService: StagingFileService,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  public async addFoto(equipoId: number, data: AddFotoDto): Promise<EquipoRead> {
    const equipoFound = await this.equiposService.findById(equipoId);
    equipoFound.addFoto(data);

    const aggregates: Array<{ pullEvents(): DomainEquipoEvent[] }> = [equipoFound];
    const correlationId = generateCorrelationId();

    return this.txManager.transactional(
      async () => {
        await this.stagingService.commit(
          {
            archivoId: data.archivoId,
            contexto: TipoContextoArchivo.REGISTRO_FOTOGRAFICO_EQUIPO,
            module: FILE_LOCATIONS.inn.eqp.hdv.regFotg,
            referenciaId: equipoId,
          },
          RESTRICCIONES_MIME_STAGING.IMAGENES
        );

        const equipoUpdated = await this.equipoRepository.updateRegistroFotografico(equipoFound);
        if (!equipoUpdated) {
          throw new NotFoundException(
            `No se pudo actualizar el registro fotográfico del equipo con id: ${equipoId}`
          );
        }
        return this.equipoRepository.findViewById(equipoUpdated.getId.getValor);
      },
      aggregates,
      correlationId
    );
  }

  public async removeFoto(equipoId: number, archivoId: number): Promise<EquipoRead> {
    const equipoFound = await this.equipoRepository.findById(equipoId);
    if (!equipoFound) {
      throw new ResourceNotFoundError(`Equipo con id: ${equipoId} no encontrado`);
    }
    const usuarioId = getUser().id;
    equipoFound.removeFoto(archivoId, usuarioId);
    return this.txManager.transactional(async () => {
      const equipoUpdated = await this.equipoRepository.updateRegistroFotografico(equipoFound);
      if (!equipoUpdated) {
        throw new NotFoundException(
          `No se pudo actualizar el registro fotográfico del equipo con id: ${equipoId}`
        );
      }
      return this.equipoRepository.findViewById(equipoUpdated.getId.getValor);
    }, [equipoFound]);
  }

  public async updateFoto(
    equipoId: number,
    archivoId: number,
    dto: UpdateFotoDto
  ): Promise<EquipoRead> {
    if (!hasDefinedValues(dto)) {
      throw new BadInputError('El objeto no puede estar vacío');
    }
    const equipoFound = await this.equipoRepository.findById(equipoId);
    if (!equipoFound) {
      throw new ResourceNotFoundError(`Equipo con id: ${equipoId} no encontrado`);
    }
    equipoFound.updateFoto(archivoId, dto);

    return this.txManager.transactional(async () => {
      const equipoUpdated = await this.equipoRepository.updateRegistroFotografico(equipoFound);
      if (!equipoUpdated) {
        throw new NotFoundException(
          `No se pudo actualizar el registro fotográfico del equipo con id: ${equipoId}`
        );
      }
      return this.equipoRepository.findViewById(equipoUpdated.getId.getValor);
    }, [equipoFound]);
  }

  public async markAsFotoPrincipal(equipoId: number, archivoId: number): Promise<EquipoRead> {
    const equipoFound = await this.equipoRepository.findById(equipoId);
    if (!equipoFound) {
      throw new ResourceNotFoundError(`Equipo con id: ${equipoId} no encontrado`);
    }
    equipoFound.markAsFotoPrincipal(archivoId);
    return this.txManager.transactional(async () => {
      const equipoUpdated = await this.equipoRepository.updateRegistroFotografico(equipoFound);
      if (!equipoUpdated) {
        throw new NotFoundException(
          `No se pudo actualizar el registro fotográfico del equipo con id: ${equipoId}`
        );
      }
      return this.equipoRepository.findViewById(equipoUpdated.getId.getValor);
    }, [equipoFound]);
  }
}
