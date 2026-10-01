import {
  BadRequestException,
  Body,
  Controller,
  HttpException,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorities } from '@common/presentation/decorators';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { INN_AUTHORITIES } from '@inn/authorities';
import { RondasHabitacionesService } from '../../infrastructure/services/rondas-habitaciones.service';

@ApiTags('Rondas de habitaciones')
@Controller('v4/inn/rondas-habitaciones')
export class RondasHabitacionesController {
  constructor(private readonly service: RondasHabitacionesService) {}
  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      throw new BadRequestException(e.message);
    }
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('dashboard') dashboard() {
    return this.run(() => this.service.dashboard());
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]) @Get('sedes') sedes() {
    return this.run(() => this.service.sedes());
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]) @Get('usuarios') usuarios(
    @Query('pattern') pattern?: string
  ) {
    return this.run(() => this.service.usuarios(pattern));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('habitaciones') habitaciones(
    @Query('sedeId') sedeId: string
  ) {
    return this.run(() => this.service.habitaciones(Number(sedeId)));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas') rondas() {
    return this.run(() => this.service.rondas());
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas/actual') actual() {
    return this.run(() => this.service.actual());
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas/:id') ronda(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.run(() => this.service.obtenerRonda(id));
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]) @Post('rondas') crearRonda(
    @Body() body: any
  ) {
    return this.run(() => this.service.crearRonda(body));
  }
  @Authorities([
    ADMIN_AUTHORITY,
    INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR,
    INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR,
  ])
  @Post('rondas/:id/completar')
  completar(@Param('id', ParseIntPipe) id: number) {
    return this.run(() => this.service.completar(id));
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas/:id/registros') registros(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.run(() => this.service.registros(id));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR])
  @Put('rondas/:rondaId/registros/:habitacionId')
  registro(
    @Param('rondaId', ParseIntPipe) rondaId: number,
    @Param('habitacionId', ParseIntPipe) habitacionId: number,
    @Body() body: any
  ) {
    return this.run(() => this.service.guardarRegistro(rondaId, habitacionId, body));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('alertas') alertas(
    @Query() filters: any
  ) {
    return this.run(() => this.service.alertas(filters));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR])
  @Patch('alertas/:id/resolver')
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body('observacionResolucion') observacion: string
  ) {
    return this.run(() => this.service.resolverAlerta(id, observacion));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR])
  @Get('rondas/:id/exportar/excel')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  exportExcel(@Param('id', ParseIntPipe) id: number) {
    return this.run(async () => this.toCsv(await this.service.registros(id)));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR])
  @Get('rondas/:id/exportar/pdf')
  async exportPdf(@Param('id', ParseIntPipe) id: number): Promise<StreamableFile> {
    const pdf = await this.run(async () =>
      this.toPdf(await this.service.obtenerRonda(id), await this.service.registros(id))
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: `attachment; filename="ronda-${id}.pdf"`,
      length: pdf.length,
    });
  }
  private toCsv(rows: any[]): string {
    return [
      'Habitación,Equipo,Estado,Observación',
      ...rows.flatMap(row =>
        row.equipos.map(
          (e: any) =>
            `${row.habitacionId},${e.tipoEquipo},${e.estado},"${(e.observacion ?? '').replaceAll('"', '""')}"`
        )
      ),
    ].join('\n');
  }
  private toPdf(ronda: any, rows: any[]): Buffer {
    const escape = (value: unknown) => String(value ?? '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/[()\\]/g, '\\$&');
    const text = (font: 'F1' | 'F2', size: number, x: number, y: number, value: unknown, color = '0.08 0.22 0.26') =>
      `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escape(value)}) Tj ET`;
    const detail = rows.flatMap((row: any) => row.equipos.map((equipo: any) =>
      `Habitacion ${row.habitacionId} | ${equipo.tipoEquipo.replaceAll('_', ' ')} | ${equipo.estado}${equipo.observacion ? ` | ${equipo.observacion}` : ''}`
    ));
    const pageSize = 31;
    const detailPages = Array.from({ length: Math.max(1, Math.ceil(detail.length / pageSize)) }, (_, index) =>
      detail.slice(index * pageSize, (index + 1) * pageSize)
    );
    const pageCount = detailPages.length;
    const contents = detailPages.map((lines, index) => {
      const isFirst = index === 0;
      const summary = isFirst
        ? [
            `Semana ${ronda.semana} - ${ronda.anio}`,
            `Responsable: ${ronda.responsableNombre}`,
            `Estado: ${ronda.estado}`,
            `Habitaciones registradas: ${ronda.habitacionesRegistradas} de ${ronda.totalHabitaciones}`,
            `Registros incluidos: ${rows.length}`,
          ]
        : [];
      const initialY = isFirst ? 540 : 670;
      const summaryContent = summary.map((line, lineIndex) => text('F2', 10, 48, 670 - lineIndex * 18, line, '0.25 0.39 0.42')).join('\n');
      const tableHeader = text('F1', 9, 48, initialY + 18, isFirst ? 'DETALLE DE EQUIPOS INSPECCIONADOS' : 'DETALLE DE EQUIPOS INSPECCIONADOS (continuacion)', '0.02 0.44 0.40');
      const detailContent = lines.map((line, lineIndex) => text('F2', 8.5, 48, initialY - lineIndex * 16, line)).join('\n');
      return [
        'q 0.02 0.39 0.36 rg 0 720 612 72 re f Q',
        text('F1', 19, 48, 756, 'RONDAS CACC', '1 1 1'),
        text('F2', 9, 48, 739, 'Reporte de ronda de habitaciones', '0.85 0.96 0.94'),
        text('F2', 8, 48, 28, `Pagina ${index + 1} de ${pageCount}`, '0.35 0.48 0.50'),
        summaryContent,
        tableHeader,
        detailContent || text('F2', 10, 48, initialY, 'No hay equipos registrados para esta ronda.', '0.35 0.48 0.50'),
      ].filter(Boolean).join('\n');
    });
    const firstPageObject = 5;
    const pageReferences = contents.map((_, index) => `${firstPageObject + index * 2} 0 R`).join(' ');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${pageReferences}] /Count ${contents.length} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      ...contents.flatMap((content, index) => {
        const pageObject = firstPageObject + index * 2;
        const contentObject = pageObject + 1;
        return [
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`,
          `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`,
        ];
      }),
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(pdf, 'ascii'));
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf, 'ascii');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
      .slice(1)
      .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
      .join('')}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'ascii');
  }
}
