import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { dataToReporteSabanasUci } from './uci-sheets-report.dtos';
const JSZip = require('jszip');
import { generateReporteSabanasUciPDF } from './uci-sheets-report.pdf-generator';
import { findImageFromContext } from '@common/application/services';
import { GCM_CONTEXTS, GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { Response } from 'express';
import { UciSheetsExternoService } from './uci-sheets-externo.service';
import { switchConn } from '@common/infrastructure/services';

@ApiTags('V1/V2/V3')
@Controller('v10/uci-sheets')
export class UciSheetsExternoController {
  constructor(private readonly uciSheetsService: UciSheetsExternoService) {}

  @Get('/datas-externo-unautenthicated')
  async getUciSheetExterno(
    @Query('Ingreso') adnIngreso: string,
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFinal') fechaFinal: Date,
    @Query('contextCode') contextCode: GcmContextCode,
    @Res() res: Response
  ) {
    const ds = switchConn(gcmContextFactory(contextCode));
    fechaInicio = new Date(`${fechaInicio}:00:00`);
    fechaFinal = new Date(`${fechaFinal}:00:00`);
    let values = await this.uciSheetsService.getUciSheet(
      adnIngreso,
      fechaInicio,
      fechaFinal,
      ds,
      contextCode
    );
    const data = values.data.filter(d => d.infoIngreso.length);
    const sabanasUci = data.map(r => dataToReporteSabanasUci(r));

    const zip = new JSZip();

    for (let i = 0; i < sabanasUci.length; i++) {
      const pdfName = `${sabanasUci[i].informacionIngreso.fechaRegistroFt}.pdf`.toLowerCase();
      const res = await generateReporteSabanasUciPDF(
        sabanasUci[i],
        findImageFromContext(GCM_CONTEXTS.ALTACENTRO)
      );

      const resBuffer = Buffer.from(res);

      await zip.file(pdfName, resBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment;`,
      'Content-Length': zipBuffer.length,
    });

    res.end(zipBuffer);
  }
}
