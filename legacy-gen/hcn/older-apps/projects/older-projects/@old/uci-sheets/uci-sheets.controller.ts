import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UciSheetsService } from './uci-sheets.service';
import { Authorities, CommonGuards } from '@hcn/old/common/presentation/decorators';
import { EstanciasService } from './estancias.service';
import { ADMIN_AUTHORITY } from '@authorities/principal';
import { HCN_AUTHORITIES } from '@authorities/historia-clinica';
import { HPN_AUTHORITIES } from '@authorities/hospitalizacion';
const JSZip = require('jszip');
import { dataToReporteSabanasUci } from './uci-sheets-report.dtos';
import { generateReporteSabanasUciPDF } from './uci-sheets-report.pdf-generator';
import { findImageFromContext } from '@common/application/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { Response } from 'express';

@CommonGuards()
@ApiTags('V1/V2/V3')
@Controller('v10/uci-sheets')
export class UciSheetsController {
  constructor(
    private readonly uciSheetsService: UciSheetsService,
    private readonly estanciasService: EstanciasService
  ) {}

  @Authorities([HCN_AUTHORITIES.BALANCES_ENFERMERIA.REPORTE_SABANAS])
  @Get('/datas-externo')
  async getUciSheetExterno(
    @Query('Ingreso') adnIngreso: string,
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFinal') fechaFinal: Date,
    @Res() res: Response
  ) {
    fechaInicio = new Date(`${fechaInicio}:00:00`);
    fechaFinal = new Date(`${fechaFinal}:00:00`);
    let values = await this.uciSheetsService.getUciSheet(adnIngreso, fechaInicio, fechaFinal);
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

  @Authorities([
    ADMIN_AUTHORITY,
    HCN_AUTHORITIES.BALANCES_ENFERMERIA.SABANAS_UCI,
    HCN_AUTHORITIES.BALANCES_ENFERMERIA.REPORTE_SABANAS,
    HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES,
    HPN_AUTHORITIES.CENSOS.PACIENTES,
  ])
  @Get()
  async getUciSheets(@Query('Ingreso') adnIngreso: string, @Query('Fecha') fecha: Date) {
    return await this.uciSheetsService.getUciSheets(adnIngreso, fecha);
  }

  @Authorities([
    ADMIN_AUTHORITY,
    HCN_AUTHORITIES.BALANCES_ENFERMERIA.SABANAS_UCI,
    HCN_AUTHORITIES.BALANCES_ENFERMERIA.REPORTE_SABANAS,
    HPN_AUTHORITIES.GESTION_CLINICA.GESTIONAR_PACIENTES,
    HPN_AUTHORITIES.CENSOS.PACIENTES,
  ])
  @Get('estancias')
  async traer_paciente_acostados() {
    try {
      const data = await this.estanciasService.traer_paciente_acostados();
      if (data.length > 0) {
        return {
          success: true,
          data,
          message: 'Censo Hospitalario',
        };
      } else {
        return {
          success: false,
          data,
          message: 'No hay datos',
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

  @Authorities([HCN_AUTHORITIES.BALANCES_ENFERMERIA.REPORTE_SABANAS])
  @Get('estancia')
  async getHpnestancia(@Query('Ingreso') adnIngreso: string) {
    return await this.uciSheetsService.getHpnestancia(adnIngreso);
  }

  @Authorities([HCN_AUTHORITIES.BALANCES_ENFERMERIA.REPORTE_SABANAS])
  @Get('/datas')
  async getUciSheet(
    @Query('Ingreso') adnIngreso: string,
    @Query('fechaInicio') fechaInicio: Date,
    @Query('fechaFinal') fechaFinal: Date
  ) {
    fechaInicio = new Date(`${fechaInicio}:00:00`);
    fechaFinal = new Date(`${fechaFinal}:00:00`);
    return await this.uciSheetsService.getUciSheet(adnIngreso, fechaInicio, fechaFinal);
  }

  @Authorities([HCN_AUTHORITIES.BALANCES_ENFERMERIA.SABANAS_UCI])
  @Get('pacientes')
  async pacientesSinPeso() {
    return await this.uciSheetsService.PacientesSinPeso();
  }
}
