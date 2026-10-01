import { FILE_LOCATIONS } from '@common/application/constants';
import { EntidadTipoAnexo } from '@common/domain/enums';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { Anexo } from '@core/media/domain/entities';
import { ANEXO_REPOSITORY, AnexoRepository } from '@core/media/domain/repositories';
import { PayloadArchivo, RESTRICCIONES_MIME_STAGING, TipoContextoArchivo } from '@core/media/domain/types';
import { AnexoItemDto } from '@core/media/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { StagingFileService } from './staging.archivo.service';


@Injectable()
export class AnexoWriter {
  constructor(
    @Inject(ANEXO_REPOSITORY)
    private readonly repo: AnexoRepository,
    private readonly stagingService: StagingFileService,
  ) { }

  async attachToRegistroActividad(
    registroId: number,
    items: AnexoItemDto[],
  ): Promise<void> {
    await this.persist({
      entidadTipo: EntidadTipoAnexo.REGISTRO_ACTIVIDAD,
      entidadId: registroId,
      items,
      append: true,
    });
  }

  async attachToEjecucionExterna(
    ejecucionId: number,
    items: AnexoItemDto[],
  ): Promise<void> {
    await this.persist({
      entidadTipo: EntidadTipoAnexo.EJECUCION_EXTERNA,
      entidadId: ejecucionId,
      items,
      append: true,
    });
  }


  async replaceForRegistroActividad(
    registroId: number,
    items: AnexoItemDto[],
  ): Promise<void> {
    await this.persist({
      entidadTipo: EntidadTipoAnexo.REGISTRO_ACTIVIDAD,
      entidadId: registroId,
      items,
      append: false,
    });
  }


  async replaceForEjecucionExterna(
    ejecucionId: number,
    items: AnexoItemDto[],
  ): Promise<void> {
    await this.persist({
      entidadTipo: EntidadTipoAnexo.EJECUCION_EXTERNA,
      entidadId: ejecucionId,
      items,
      append: false,
    });
  }


  private async persist(params: {
    entidadTipo: EntidadTipoAnexo;
    entidadId: number;
    items: AnexoItemDto[];
    append: boolean;
  }): Promise<void> {
    if (!params.items.length) return;

    await this.commitPendingArchivos(params.entidadId, params.items);

    const offset = params.append
      ? await this.repo.countByEntidad(params.entidadTipo, params.entidadId)
      : 0;

    const anexos = params.items.map((item, idx) =>
      Anexo.create({
        entidadTipo: params.entidadTipo,
        entidadId: params.entidadId,
        archivoId: item.archivoId,
        nombre: item.nombre,
        observaciones: item.observaciones,
        orden: item.orden != null ? item.orden + offset : offset + idx,
      }),
    );

    await this.repo.saveMany(anexos);
  }

  private async commitPendingArchivos(
    referenciaId: number,
    items: AnexoItemDto[],
  ): Promise<void> {
    const archivos = await this.stagingService.findByIds(items.map((i) => i.archivoId));
    const archivosMap = new Map(archivos.map((a) => [a.getId.getValor, a]));

    const payloads: PayloadArchivo[] = [];

    for (const item of items) {
      const archivo = archivosMap.get(item.archivoId);
      if (!archivo) {
        throw new ResourceNotFoundError(
          `Archivo con id ${item.archivoId} no encontrado, no se puede anexar`,
        );
      }

      if (archivo.getIsUsado && !archivo.getIsTemporal) {
        continue;
      }

      if (archivo.getIsUsado) {
        throw new BadInputError(
          `Archivo con id ${item.archivoId} ya está en uso, por favor cargue otro`,
        );
      }

      payloads.push({
        archivoId: item.archivoId,
        contexto: TipoContextoArchivo.MANTENIMIENTO,
        module: FILE_LOCATIONS.inn.eqp.actividaes,
        referenciaId,
      });
    }

    if (payloads.length) {
      await this.stagingService.commitMany(
        payloads,
        RESTRICCIONES_MIME_STAGING.ANEXOS,
      );
    }
  }
}
