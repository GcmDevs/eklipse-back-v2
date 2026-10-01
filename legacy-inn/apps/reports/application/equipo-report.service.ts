import { ensureArray } from '@common/application/services';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { DocumentoTipoEquipoOrm } from '@orm/inn/equipos/catalogo/documento-tipo-equipo.orm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PuppeteerPdfGenerator } from '../infrastructure/exporters';
import { HdvEquipoReportMapper } from '../infrastructure/mappers';
import { TypeOrmEquipoReportRepository } from '../infrastructure/persistence/repositories';
import * as fs from 'fs';
import * as path from 'path';
import { formatFecha } from '../domain/helpers';
import { DocumentoEquipoPdf } from '../domain/types';

@Injectable()
export class EquipoReportService {
  constructor(
    private readonly repository: TypeOrmEquipoReportRepository,
    private readonly pdfGenerator: PuppeteerPdfGenerator,
    private readonly stagingFileService: StagingFileService,
  ) {}

  public async exportPdfReportByEquipoId(equipoId: number): Promise<Buffer> {
    const equipo = await this.repository.findHdvReport(equipoId);
    if (!equipo) {
      throw new NotFoundException(
        `No se encontró el equipo con id ${equipoId}`,
      );
    }

    const documentosEquipo = [...equipo.tipoEquipoRel.documentos, ...equipo.compra.documentos];
    if (equipo.tipoEquipoRel) {
      equipo.tipoEquipoRel.documentos = documentosEquipo;
    }

    const responsable = equipo.responsable?.responsableId
      ? await this.repository.findDepartamentoEquipoByResponsableId(
          equipo.responsable.responsableId,
        )
      : null;

    const documentos = this.resolveDocumentosTipoEquipo(documentosEquipo);

    const reportData = HdvEquipoReportMapper.toHojaVidaPdfReport(
      equipo,
      responsable,
      documentos,
    );

    const fotos = ensureArray(equipo.registroFotografico?.getFotos());
    const fotoPrincipal = fotos.find((f) => f.principal) ?? fotos[0];
    if (fotoPrincipal?.archivoId) {
      reportData.identificacion.fotoEquipo = await this.resolveFotoDataUri(
        fotoPrincipal.archivoId,
      );
    }

    const templatePath = path.join(
      process.cwd(),
      'apps/reports/infrastructure/exporters/pdf/templates/report-hdvequipo.template.hbs',
    );

    const logoPath = path.join(
      process.cwd(),
      '../private/clinicas/alta-centro.jpg',
    );
    const images: Record<string, string> = {};
    if (fs.existsSync(logoPath)) {
      const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
      images['logo'] = `data:image/jpeg;base64,${logoBase64}`;
    }

    return this.pdfGenerator.generatePdfFromHtml({
      data: {
        ...reportData,
        fechaImpresion: formatFecha(),
      },
      templatePath,
      images,
    });
  }


  private resolveDocumentosTipoEquipo(
    documentosTipoEquipo: DocumentoTipoEquipoOrm[],
  ): DocumentoEquipoPdf[] {
    return documentosTipoEquipo
      .filter((d) => d.activo !== false)
      .map((d) => ({
        nombre: d.tipoDocumento?.nombre ?? '',
        aplica: !!d.aplica,
        observaciones: d.observaciones ?? undefined,
      }));
  }

  private async resolveFotoDataUri(
    archivoId: number,
  ): Promise<string | undefined> {
    try {
      const archivo = await this.stagingFileService.findById(archivoId, {
        throwIfNotFound: false,
      });
      if (!archivo) {
        return undefined;
      }

      const rutaArchivo = archivo.getRutaArchivo;
      if (!rutaArchivo || !fs.existsSync(rutaArchivo)) {
        return undefined;
      }

      const buffer = fs.readFileSync(rutaArchivo);
      return `data:${archivo.getTipoMime};base64,${buffer.toString('base64')}`;
    } catch {
      return undefined;
    }
  }
}
