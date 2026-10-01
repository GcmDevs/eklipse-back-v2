import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { DocumentoTipoEquipo } from '@equipos/domain/entities/catalogo/documento-tipo-equipo.entity';
import { DocumentoTipoEquipoRead } from '@equipos/domain/read';
import { DocumentoTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/documento-tipo-equipo.repository';
import { ICompraRepository } from '@equipos/domain/repositories/compra.repository';
import {
  COMPRA_REPOSITORY,
  DOCUMENTO_TIPO_EQUIPO_REPOSITORY,
} from '@equipos/domain/repositories/tokens';
import {
  CreateDocumentoTipoEquipoDto,
  UpdateDocumentoTipoEquipoDto,
} from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import {
  assertTipoDocTransaccional,
  commitDocumentoTipoEquipoArchivo,
  enrichDocumentosTipoEquipoRead,
  validateDocumentoInput,
} from '../../helpers/documento-tipo-equipo.helper';
import { TipoDocCategoriaActivoService } from '../catalogo/tipo-doc-categoria-activo.service';

@Injectable()
export class DocumentoCompraService {
  constructor(
    @Inject(DOCUMENTO_TIPO_EQUIPO_REPOSITORY)
    private readonly repository: DocumentoTipoEquipoRepository,
    @Inject(COMPRA_REPOSITORY)
    private readonly compraRepository: ICompraRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly stagingFileService: StagingFileService,
    private readonly tipoDocCategoriaService: TipoDocCategoriaActivoService
  ) { }

  async create(
    compraId: number,
    { tipoDocumentoId, aplica, archivoId, observaciones }: CreateDocumentoTipoEquipoDto
  ): Promise<DocumentoTipoEquipoRead> {
    await this.assertCompraExists(compraId);
    const tipoDoc = await this.tipoDocCategoriaService.findById(tipoDocumentoId, {
      throwIfNotFound: true,
    });

    assertTipoDocTransaccional(tipoDoc.getCategoria);
    await validateDocumentoInput(
      this.stagingFileService,
      tipoDoc.getCategoria,
      aplica,
      false,
      archivoId
    );

    const documento = DocumentoTipoEquipo.createForCompra(
      compraId,
      tipoDocumentoId,
      aplica,
      archivoId,
      observaciones
    );

    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(documento);
      if (aplica && archivoId) {
        await commitDocumentoTipoEquipoArchivo(
          this.stagingFileService,
          tipoDoc.getCategoria,
          archivoId,
          saved.getId.getValor
        );
      }
      const view = await this.repository.findViewById(saved.getId.getValor);
      const [enriched] = await enrichDocumentosTipoEquipoRead(this.stagingFileService, [view]);
      return enriched;
    });
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<DocumentoTipoEquipo | null> {
    const entity = await this.repository.findById(id);
    if (!entity && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`DocumentoCompra con id: ${id} no encontrado`);
    }
    return entity;
  }

  async update(
    compraId: number,
    id: number,
    data: UpdateDocumentoTipoEquipoDto
  ): Promise<DocumentoTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      await this.assertBelongsToCompra(compraId, id);
      const documento = await this.findById(id, { throwIfNotFound: true });

      const tipoDocumentoId = data.tipoDocumentoId ?? documento.getTipoDocumentoId;
      const aplica = data.aplica ?? documento.getAplica;
      const archivoId = data.archivoId ?? documento.getArchivoId;

      const tipoDoc = await this.tipoDocCategoriaService.findById(tipoDocumentoId, {
        throwIfNotFound: true,
      });
      assertTipoDocTransaccional(tipoDoc.getCategoria);

      if (
        data.archivoId !== undefined ||
        data.aplica !== undefined ||
        data.tipoDocumentoId !== undefined
      ) {
        await validateDocumentoInput(
          this.stagingFileService,
          tipoDoc.getCategoria,
          aplica,
          false,
          archivoId
        );
      }

      documento.update(data);
      await this.repository.update(documento);

      if (aplica && data.archivoId) {
        await commitDocumentoTipoEquipoArchivo(
          this.stagingFileService,
          tipoDoc.getCategoria,
          data.archivoId,
          id
        );
      }

      return this.repository.findViewById(id);
    });
  }

  async depreciate(compraId: number, id: number): Promise<DocumentoTipoEquipoRead> {
    return this.txManager.transactional(async () => {
      await this.assertBelongsToCompra(compraId, id);
      const entity = await this.findById(id, { throwIfNotFound: true });
      entity.depreciate();
      await this.repository.update(entity);
      return this.repository.findViewById(id);
    });
  }

  private async assertCompraExists(compraId: number): Promise<void> {
    const compra = await this.compraRepository.findById(compraId);
    if (!compra) {
      throw new ResourceNotFoundError(`Compra con id: ${compraId} no encontrada`);
    }
  }

  private async assertBelongsToCompra(
    compraId: number,
    id: number
  ): Promise<DocumentoTipoEquipoRead> {
    const currentDoc = await this.repository.findViewById(id);
    if (!currentDoc || currentDoc.compraId !== compraId) {
      throw new ResourceNotFoundError(
        `DocumentoCompra con id: ${id} no encontrado para la compra ${compraId}`
      );
    }
    return currentDoc;
  }
}
