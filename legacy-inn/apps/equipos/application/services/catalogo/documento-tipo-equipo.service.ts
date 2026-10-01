import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { DocumentoTipoEquipo } from '@equipos/domain/entities/catalogo/documento-tipo-equipo.entity';
import { TipoAuditTipoEquipo } from '@equipos/domain/enums';
import { DocumentoTipoEquipoRead } from '@equipos/domain/read';
import { DocumentoTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/documento-tipo-equipo.repository';
import { TipoEquipoRepository } from '@equipos/domain/repositories/catalogo/tipo-equipo.repository';
import { DOCUMENTO_TIPO_EQUIPO_REPOSITORY, TIPO_EQUIPO_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { CreateDocumentoTipoEquipoDto, UpdateDocumentoTipoEquipoDto } from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { AuditTipoEquipoService } from '../../audit/audit-tipo-equipo.service';
import {
  assertTipoDocAplica,
  commitDocumentoTipoEquipoArchivo,
  enrichDocumentosTipoEquipoRead,
  validateDocumentoInput,
} from '../../helpers/documento-tipo-equipo.helper';
import { TipoDocCategoriaActivoService } from './tipo-doc-categoria-activo.service';

@Injectable()
export class DocumentoTipoEquipoService {
  constructor(
    @Inject(DOCUMENTO_TIPO_EQUIPO_REPOSITORY)
    private readonly repository: DocumentoTipoEquipoRepository,
    @Inject(TIPO_EQUIPO_REPOSITORY)
    private readonly tipoEquipoRepository: TipoEquipoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly tipoDocCategoriaService: TipoDocCategoriaActivoService,
    private readonly auditService: AuditTipoEquipoService,
  ) { }

  async create(
    tipoEquipoId: number,
    { tipoDocumentoId, aplica, archivoId, observaciones }: CreateDocumentoTipoEquipoDto,
  ): Promise<DocumentoTipoEquipoRead> {
    const tipoActivoId = await this.resolveTipoActivoIdByTipoEquipo(tipoEquipoId);
    const tipoDoc = await this.tipoDocCategoriaService.findById(tipoDocumentoId, { throwIfNotFound: true });
    assertTipoDocAplica(tipoDoc, tipoActivoId);
    await validateDocumentoInput(
      this.stagingFileService,
      tipoDoc.getCategoria,
      aplica,
      tipoDoc.IsObligatorioPara(tipoActivoId),
      archivoId,
    );

    const docTipoEquipo = DocumentoTipoEquipo.createForTipoEquipo(tipoEquipoId, tipoDocumentoId, aplica, archivoId, observaciones);
    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(docTipoEquipo);
      if (aplica && archivoId) {
        await commitDocumentoTipoEquipoArchivo(
          this.stagingFileService,
          tipoDoc.getCategoria,
          archivoId,
          saved.getId.getValor,
        );
      }
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.DOCUMENTO_AGREGADO,
        valorNuevo: tipoDoc.getNombre,
        observaciones: `Documento "${tipoDoc.getNombre}" agregado`,
      });
      const view = await this.repository.findViewById(saved.getId.getValor);
      const [enriched] = await enrichDocumentosTipoEquipoRead(this.stagingFileService, [view]);
      return enriched;
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<DocumentoTipoEquipo | null> {
    const entity = await this.repository.findById(id);
    if (!entity && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`DocumentoTipoEquipo con id: ${id} no encontrado`);
    }
    return entity;
  }

  async update(
    tipoEquipoId: number,
    id: number,
    data: UpdateDocumentoTipoEquipoDto,
  ): Promise<DocumentoTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      await this.assertBelongsToTipoEquipo(tipoEquipoId, id);
      const docTipoEquipo = await this.findById(id, { throwIfNotFound: true });

      const tipoDocumentoId = data.tipoDocumentoId ?? docTipoEquipo.getTipoDocumentoId;
      const aplica = data.aplica ?? docTipoEquipo.getAplica;
      const archivoId = data.archivoId ?? docTipoEquipo.getArchivoId;

      const tipoActivoId = await this.resolveTipoActivoIdByTipoEquipo(docTipoEquipo.getTipoEquipoId.getValor);
      const tipoDoc = await this.tipoDocCategoriaService.findById(tipoDocumentoId, { throwIfNotFound: true });
      assertTipoDocAplica(tipoDoc, tipoActivoId);

      if (data.archivoId !== undefined || data.aplica !== undefined || data.tipoDocumentoId !== undefined) {
        await validateDocumentoInput(
          this.stagingFileService,
          tipoDoc.getCategoria,
          aplica,
          tipoDoc.IsObligatorioPara(tipoActivoId),
          archivoId,
        );
      }

      docTipoEquipo.update(data);
      await this.repository.update(docTipoEquipo);

      if (aplica && data.archivoId) {
        await commitDocumentoTipoEquipoArchivo(
          this.stagingFileService,
          tipoDoc.getCategoria,
          data.archivoId,
          id,
        );
      }

      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.DOCUMENTO_MODIFICADO,
        valorNuevo: tipoDoc.getNombre,
        observaciones: `Documento "${tipoDoc.getNombre}" modificado`,
      });

      return this.repository.findViewById(id);
    });
  }

  async depreciate(tipoEquipoId: number, id: number): Promise<DocumentoTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      const current = await this.assertBelongsToTipoEquipo(tipoEquipoId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.depreciate();
      await this.repository.update(entity);
      await this.auditService.record({
        tipoEquipoId,
        tipo: TipoAuditTipoEquipo.DOCUMENTO_DEPRECADO,
        valorAnterior: current.tipoDocumentoNombre,
        observaciones: `Documento "${current.tipoDocumentoNombre}" deprecado`,
      });
      return this.repository.findViewById(id);
    });
  }

  private async assertBelongsToTipoEquipo(tipoEquipoId: number, id: number): Promise<DocumentoTipoEquipoRead> {
    const currentDoc = await this.repository.findViewById(id);
    if (!currentDoc || currentDoc.tipoEquipoId !== tipoEquipoId) {
      throw new ResourceNotFoundError(
        `DocumentoTipoEquipo con id: ${id} no encontrado para el tipoEquipo ${tipoEquipoId}`,
      );
    }
    return currentDoc;
  }

  private async resolveTipoActivoIdByTipoEquipo(tipoEquipoId: number): Promise<number> {
    const tipoEquipo = await this.tipoEquipoRepository.findById(tipoEquipoId);
    if (!tipoEquipo) {
      throw new ResourceNotFoundError(`TipoEquipo con id: ${tipoEquipoId} no encontrado`);
    }
    return tipoEquipo.getTipoActivoId.getValor;
  }
}
