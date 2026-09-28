import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorities } from '@common/presentation/decorators';
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
      throw new BadRequestException(e.message);
    }
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('dashboard') dashboard() {
    return this.run(() => this.service.dashboard());
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]) @Get('sedes') sedes() {
    return this.run(() => this.service.sedes());
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]) @Get('usuarios') usuarios(
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
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas/actual') actual() {
    return this.run(() => this.service.actual());
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas/:id') ronda(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.run(() => this.service.obtenerRonda(id));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR]) @Post('rondas') crearRonda(
    @Body() body: any
  ) {
    return this.run(() => this.service.crearRonda(body));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR])
  @Post('rondas/:id/completar')
  completar(@Param('id', ParseIntPipe) id: number) {
    return this.run(() => this.service.completar(id));
  }
  @Authorities([INN_AUTHORITIES.RONDAS_HABITACIONES.ADMINISTRAR, INN_AUTHORITIES.RONDAS_HABITACIONES.EJECUTAR]) @Get('rondas/:id/registros') registros(
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
  @Header('Content-Type', 'application/pdf')
  exportPdf(@Param('id', ParseIntPipe) id: number) {
    return this.run(async () =>
      this.toPdf(await this.service.obtenerRonda(id), await this.service.registros(id))
    );
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
    const lines = [
      `Rondas de habitaciones`,
      `Semana ${ronda.semana} - ${ronda.anio}`,
      `Responsable: ${ronda.responsableNombre}`,
      `Habitaciones revisadas: ${ronda.habitacionesRegistradas} de ${ronda.totalHabitaciones}`,
      `Registros incluidos: ${rows.length}`,
    ];
    const content = `BT /F1 14 Tf 50 760 Td ${lines.map((line, i) => `(${line.replace(/[()\\]/g, '\\$&')}) Tj${i < lines.length - 1 ? ' 0 -22 Td ' : ''}`).join('')} ET`;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
      .slice(1)
      .map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)
      .join('')}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf);
  }
}
