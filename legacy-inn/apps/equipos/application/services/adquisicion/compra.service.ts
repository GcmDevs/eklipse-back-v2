import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions } from '@common/domain/types';
import { CONSECUTIVOS_CODES, ConsecutivoService } from '@core/consecutivos/application';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { ProveedorService, TerceroService } from '@core/terceros/application/services';
import { commitDocumentoTipoEquipoArchivo, validateDocumentoInput } from '@equipos/application/helpers/documento-tipo-equipo.helper';
import { DocumentoTipoEquipo } from '@equipos/domain/entities';
import { Compra } from '@equipos/domain/entities/compra.entity';
import { CompraRead } from '@equipos/domain/read';
import { DocumentoTipoEquipoRepository, EquiposRepository } from '@equipos/domain/repositories';
import { ICompraRepository } from '@equipos/domain/repositories/compra.repository';
import { COMPRA_REPOSITORY, DOCUMENTO_TIPO_EQUIPO_REPOSITORY, EQUIPOS_REPOSITORY } from '@equipos/domain/repositories/tokens';
import { AgregarEquiposCompraDto, CreateCompraDto, ReplaceTipoEquipoDto, UpdateCompraDto } from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { TipoDocCategoriaActivoService } from '../catalogo';

@Injectable()
export class CompraService {
  constructor(
    @Inject(COMPRA_REPOSITORY)
    private readonly repository: ICompraRepository,
    @Inject(EQUIPOS_REPOSITORY)
    private readonly equipoRepository: EquiposRepository,
    @Inject(DOCUMENTO_TIPO_EQUIPO_REPOSITORY)
    private readonly documentoRepository: DocumentoTipoEquipoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager,
    private readonly consecutivoService: ConsecutivoService,
    private readonly proveedorService: ProveedorService,
    private readonly tipoDocCategoriaService: TipoDocCategoriaActivoService,
    private readonly terceroService: TerceroService,
    private readonly stagingFileService: StagingFileService,
  ) { }

  async create({
    codigo, fechaCompra, tipoAdquisicion, proveedorId,
    numFactura, fechaFactura, fechaFabricacion,
    aplicaGarantia, fechVencGarantia, fabricanteId,
    distribuidorId, observaciones, documentos
  }: CreateCompraDto): Promise<CompraRead> {
    const resolvedCodigo = codigo ?? await this.consecutivoService.generate(CONSECUTIVOS_CODES.ADQUISICION);
    const snaps = await this.resolveSnapshots(proveedorId, fabricanteId, distribuidorId);
    const compra = Compra.create(
      resolvedCodigo, new Date(fechaCompra), tipoAdquisicion, proveedorId,
      snaps.proveedorSnap,
      numFactura, fechaFactura ? new Date(fechaFactura) : undefined,
      fechaFabricacion ? new Date(fechaFabricacion) : undefined,
      aplicaGarantia, fechVencGarantia ? new Date(fechVencGarantia) : undefined,
      fabricanteId, distribuidorId,
      snaps.fabricanteSnap, snaps.distribuidorSnap,
      observaciones,
    );
    return this.txManager.transactional(async () => {
      const saved = await this.repository.save(compra);
      await this.syncDocumentos(saved.getId.getValor, documentos ?? []);
      return this.repository.findViewById(saved.getId.getValor);
    });
  }

  async getById(id: number): Promise<CompraRead> {
    const compra = await this.repository.findViewById(id);
    if (!compra) throw new ResourceNotFoundError(`Registro de entrada con id: ${id} no encontrado`);
    return compra;
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions(),
  ): Promise<Compra | null> {
    const compraFound = await this.repository.findById(id);
    if (!compraFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Compra con id: ${id} no encontrada`);
    }
    return compraFound;
  }

  async update(id: number, data: UpdateCompraDto): Promise<CompraRead> {
    const compra = await this.findById(id);

    const proveedorId = data.proveedorId ?? compra!.getProveedorId.getValor;
    const fabricanteId = data.fabricanteId !== undefined ? data.fabricanteId : compra!.getFabricanteId?.getValor;
    const distribuidorId = data.distribuidorId !== undefined ? data.distribuidorId : compra!.getDistribuidorId?.getValor;

    const needsSnapRefresh = data.proveedorId !== undefined
      || data.fabricanteId !== undefined
      || data.distribuidorId !== undefined;

    let snaps: { proveedorSnap: string; fabricanteSnap: string; distribuidorSnap?: string } | undefined;
    if (needsSnapRefresh) {
      snaps = await this.resolveSnapshots(proveedorId, fabricanteId ?? undefined, distribuidorId ?? undefined);
    }

    compra!.update({
      fechaCompra: data.fechaCompra ? new Date(data.fechaCompra) : undefined,
      tipoAdquisicion: data.tipoAdquisicion,
      numFactura: data.numFactura,
      fechaFactura: data.fechaFactura !== undefined
        ? (data.fechaFactura ? new Date(data.fechaFactura) : undefined)
        : undefined,
      fechaFabricacion: data.fechaFabricacion !== undefined
        ? (data.fechaFabricacion ? new Date(data.fechaFabricacion) : undefined)
        : undefined,
      aplicaGarantia: data.aplicaGarantia,
      fechVencGarantia: data.fechVencGarantia !== undefined
        ? (data.fechVencGarantia ? new Date(data.fechVencGarantia) : undefined)
        : undefined,
      proveedorId: data.proveedorId,
      fabricanteId: data.fabricanteId,
      distribuidorId: data.distribuidorId,
      proveedorSnap: snaps?.proveedorSnap,
      fabricanteSnap: snaps?.fabricanteSnap,
      distribuidorSnap: snaps?.distribuidorSnap ?? (data.distribuidorId === null ? null : undefined),
      observaciones: data.observaciones,
    });

    return this.txManager.transactional(async () => {
      await this.repository.update(compra!);
      return this.repository.findViewById(id);
    });
  }

  async addEquiposACompra(compraId: number, { equipoIds }: AgregarEquiposCompraDto): Promise<CompraRead> {
    if (!equipoIds?.length) {
      throw new BadInputError('Debe proporcionar al menos un equipo');
    }

    await this.findById(compraId);

    return this.txManager.transactional(async () => {
      for (const equipoId of equipoIds) {
        const equipo = await this.equipoRepository.findById(equipoId);
        if (!equipo) {
          throw new ResourceNotFoundError(`Equipo con id ${equipoId} no encontrado`);
        }
        equipo.update({ compraId });
        await this.equipoRepository.update(equipo);
      }
      return this.repository.findViewById(compraId);
    });
  }

  async findAllAndCount(page: number, limit: number, search?: string): Promise<[CompraRead[], number]> {
    return this.repository.findAllAndCount(page, limit, search);
  }

  private async resolveSnapshots(
    proveedorId: number,
    fabricanteId?: number,
    distribuidorId?: number,
  ): Promise<{ proveedorSnap: string; fabricanteSnap: string; distribuidorSnap?: string }> {
    const proveedor = await this.proveedorService.findById(proveedorId, { throwIfNotFound: true });
    const proveedorSnap = proveedor.nombre ?? proveedor.codigo;

    let fabricanteSnap = proveedorSnap;
    if (fabricanteId) {
      const fabricante = await this.terceroService.findById(fabricanteId, { throwIfNotFound: true });
      fabricanteSnap = fabricante.nombre;
    }

    let distribuidorSnap: string | undefined;
    if (distribuidorId) {
      const distribuidor = await this.terceroService.findById(distribuidorId, { throwIfNotFound: true });
      distribuidorSnap = distribuidor.nombre;
    }

    return { proveedorSnap, fabricanteSnap, distribuidorSnap };
  }

  private async syncDocumentos(
    compraId: number,
    documentos: ReplaceTipoEquipoDto['documentos'],
  ): Promise<void> {
    const existentes = await this.documentoRepository.findByCompraId(compraId);
    for (const old of existentes) {
      await this.documentoRepository.delete(old.id);
    }

    for (const d of documentos) {
      const tipoDoc = await this.tipoDocCategoriaService.findById(d.tipoDocumentoId, { throwIfNotFound: true });
      await validateDocumentoInput(
        this.stagingFileService,
        tipoDoc.getCategoria,
        d.aplica,
        undefined,
        d.archivoId,
      );
      const entity = DocumentoTipoEquipo.createForCompra(
        compraId, d.tipoDocumentoId, d.aplica, d.archivoId, d.observaciones,
      );
      const savedDoc = await this.documentoRepository.save(entity);
      if (d.aplica && d.archivoId) {
        await commitDocumentoTipoEquipoArchivo(
          this.stagingFileService,
          tipoDoc.getCategoria,
          d.archivoId,
          savedDoc.getId.getValor,
        );
      }
    }
  }
}
