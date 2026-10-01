import { MimeTypes } from '@common/domain/enums';
import { BaseShelteredController } from '@common/presentation/controllers';
import { FileResponse } from '@common/presentation/decorators';
import { FileResponseHelper } from '@common/presentation/helpers';
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import { EquipoReportService, EquiposReportListService } from 'apps/reports/application';
import { resolveContentDisposition } from 'apps/reports/domain/helpers';
import { Response } from 'express';
import { EquiposCustomReportListDto, EquiposInventarioReportListDto } from '../dto';

@Controller('/v4/inn/reports/equipos')
export class EquiposReportController extends BaseShelteredController {
    constructor(
        private readonly equipoReportService: EquipoReportService,
        private readonly equiposReportListService: EquiposReportListService,
    ) { super() }

    @Post('/listado')
    @HttpCode(HttpStatus.OK)
    @FileResponse()
    public async exportEquiposCustomExcel(
        @Res({ passthrough: false }) res: Response,
        @Body() body: EquiposCustomReportListDto,
        @Query('download') download?: string,
    ): Promise<void> {
        const workbook = await this.equiposReportListService.exportCustomReportExcel(body);
        FileResponseHelper.send(
            res,
            workbook,
            MimeTypes.XLSX,
            resolveContentDisposition(download, 'equipos-custom-export.xlsx'),
        );
    }

    @Post('/inventario')
    @HttpCode(HttpStatus.OK)
    @FileResponse()
    public async exportEquiposInventarioExcel(
        @Res({ passthrough: false }) res: Response,
        @Body() body: EquiposInventarioReportListDto,
        @Query('download') download?: string,
    ): Promise<void> {
        const workbook = await this.equiposReportListService.exportInventarioReportExcel(body);
        FileResponseHelper.send(
            res,
            workbook,
            MimeTypes.XLSX,
            resolveContentDisposition(download, 'equipos-inventario-export.xlsx'),
        );
    }

    @Get('/:equipoId')
    @HttpCode(HttpStatus.OK)
    @FileResponse()
    public async getHdvPdfReportByEquipoId(
        @Res({ passthrough: false }) res: Response,
        @Param('equipoId', ParseIntPipe) equipoId: number,
        @Query('download') download?: string,
    ): Promise<void> {
        const pdf = await this.equipoReportService.exportPdfReportByEquipoId(equipoId);
        FileResponseHelper.send(
            res,
            pdf,
            MimeTypes.PDF,
            resolveContentDisposition(download, `hdv-equipo-${equipoId}.pdf`),
        );
    }
}
