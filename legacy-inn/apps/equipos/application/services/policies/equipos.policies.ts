import { TimerServices } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { EstadoEquipo } from '@equipos/domain/enums';
import { DarDeBajaEquipoDto } from '@equipos/presentation/dto';
import { Injectable } from '@nestjs/common';
import { EquiposService } from '../equipo.service';

@Injectable()
export class EquiposPolicies {
  constructor(
    private readonly equipoService: EquiposService,
    private readonly stagingFileService: StagingFileService
  ) {}

  public async validateChangeEstado(id: number, { nuevoEstado }): Promise<void> {
    if (nuevoEstado === EstadoEquipo.DE_BAJA) throw new BadInputError(`Use el proceso dar de baja`);

    const equipo = await this.equipoService.findById(id);
    equipo.assertCanChangeEstado(nuevoEstado);
  }

  public async validateDarDeBaja(equipoId: number, data: DarDeBajaEquipoDto): Promise<void> {
    const equipo = await this.equipoService.findById(equipoId);
    if (equipo.getEstado === EstadoEquipo.DE_BAJA)
      throw new BadInputError('El equipo ya está dado de baja');

    const archivo = await this.stagingFileService.findById(data.archivoActaId, {
      throwIfNotFound: false,
    });
    if (!archivo) throw new ResourceNotFoundError('Acta de baja no encontrada');

    if (archivo.getIsUsado || !archivo.getIsTemporal)
      throw new BadInputError(
        `Archivo con id: ${archivo.getId.getValor} ya esta en uso, por favor cargue otro`
      );

    if (data?.fechaBaja) {
      const futureFechaBaja = TimerServices.isFutureDate(data.fechaBaja);
      if (futureFechaBaja)
        throw new BadInputError(`la fecha de baja no puede ser una fecha futura`);
    }
  }
}
