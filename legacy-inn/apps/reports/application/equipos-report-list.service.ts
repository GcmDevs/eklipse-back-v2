import { FileExtensions } from '@common/domain/enums';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { formatFecha } from '../domain/helpers';
import {
  EQUIPOS_CUSTOM_COLUMNS,
  EquiposCustomReportInput,
  EquiposInventarioReportInput,
} from '../domain/types/equipos';
import {
  ExceljsEquiposCustomExportGenerator,
  ExceljsInventarioExportGenerator,
} from '../infrastructure/exporters';
import {
  EquiposCustomReportMapper,
  EquiposInventarioReportMapper,
} from '../infrastructure/mappers';
import { TypeOrmEquiposReportListRepository } from '../infrastructure/persistence/repositories';

@Injectable()
export class EquiposReportListService {
  constructor(
    private readonly repository: TypeOrmEquiposReportListRepository,
    private readonly excelCustomReportGenerator: ExceljsEquiposCustomExportGenerator,
    private readonly excelInventarioReportGenerator: ExceljsInventarioExportGenerator
  ) {}

  public async exportCustomReportExcel(input: EquiposCustomReportInput): Promise<Buffer> {
    const equipos = await this.repository.findForExportList(input.filtros);
    const rows = EquiposCustomReportMapper.toExportRows(equipos);
    const logo = this.resolveLogo();
    const columnas = input.columnas?.length > 0 ? input.columnas : [...EQUIPOS_CUSTOM_COLUMNS];

    return this.excelCustomReportGenerator.generate({
      titulo: 'Reporte de equipos',
      fechaImpresion: formatFecha(),
      columnas,
      rows,
      logo,
    });
  }

  public async exportInventarioReportExcel(input: EquiposInventarioReportInput): Promise<Buffer> {
    const equipos = await this.repository.findForExportList(input.filtros);
    const rows = EquiposInventarioReportMapper.toExportRows(equipos);

    return this.excelInventarioReportGenerator.generate({
      fechaGeneracion: formatFecha(),
      rows,
    });
  }

  private resolveLogo():
    | { buffer: Buffer; extension: FileExtensions.JPEG | FileExtensions.PNG }
    | undefined {
    const logoPath = path.join(process.cwd(), '../private/clinicas/alta-centro.jpg');
    if (!fs.existsSync(logoPath)) {
      return undefined;
    }
    return {
      buffer: fs.readFileSync(logoPath),
      extension: FileExtensions.JPEG,
    };
  }
}
