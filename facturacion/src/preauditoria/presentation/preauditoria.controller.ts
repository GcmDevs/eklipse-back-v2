import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { CommonGuards } from '@common/presentation/decorators';
import { FiltrosPre } from '../domain/modelo';
import { MAX_PDF_PRE } from '../infrastructure/prefactura';
import { PreauditoriaService } from '../application/preauditoria.service';
import {
  AccionPreDto,
  ConfiguracionPreDto,
  CupPreDto,
  EntregaPreDto,
  FinalizarPreDto,
  GuardadoPreDto,
  HoraPreDto,
  RecepcionPreDto,
  SalarioPreDto,
  VersionPreDto,
} from './dtos';

@ApiTags('Preauditoría')
@ApiBearerAuth()
@CommonGuards()
@Controller('v1/preauditoria')
export class PreauditoriaController {
  constructor(private readonly servicio: PreauditoriaService) {}
  @Get('sesion') @Header('Cache-Control', 'no-store') sesion() {
    return this.servicio.sesion();
  }
  @Get('ingreso') @Header('Cache-Control', 'no-store') ingreso(@Query('ingreso') ingreso: string) {
    return this.servicio.consultarIngreso(ingreso);
  }
  @Post('prefacturas/analizar')
  @Header('Cache-Control', 'no-store')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PDF_PRE, files: 1, fields: 1 },
    })
  )
  analizar(@Body('ingreso') ingreso: string, @UploadedFile() archivo: Express.Multer.File) {
    return this.servicio.analizar(ingreso, archivo);
  }
  @Post('auditorias') recibir(@Body() p: RecepcionPreDto) {
    return this.servicio.recibir({ ...p });
  }
  @Get('auditorias') @Header('Cache-Control', 'no-store') listar(@Query() f: FiltrosPre) {
    return this.servicio.listar(f);
  }
  @Get('auditorias/:id') @Header('Cache-Control', 'no-store') detalle(
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.servicio.detalle(id);
  }
  @Post('auditorias/:id/acciones') accion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() p: AccionPreDto
  ) {
    return this.servicio.accion(id, p);
  }
  @Patch('auditorias/:id/borrador') borrador(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() p: GuardadoPreDto
  ) {
    return this.servicio.borrador(id, p);
  }
  @Get('auditorias/:id/vista-previa')
  async previa(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('version', ParseIntPipe) version: number,
    @Res({ passthrough: true }) res: Response
  ) {
    const r = await this.servicio.vistaPrevia(id, version);
    res.setHeader('X-Preauditoria-Vista', r.token);
    return this.archivo(res, r.contenido, 'application/pdf', 'Vista-previa.pdf', true);
  }
  @Post('auditorias/:id/finalizar') finalizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() p: FinalizarPreDto
  ) {
    return this.servicio.finalizar(id, p);
  }
  @Get('auditorias/:id/revisiones') @Header('Cache-Control', 'no-store') revisiones(
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.servicio.revisiones(id);
  }
  @Get('auditorias/:id/revisiones/:numero/pdf')
  async revision(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('numero', ParseIntPipe) numero: number,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.archivo(
      res,
      await this.servicio.pdfRevision(id, numero),
      'application/pdf',
      `Auditoria-v${numero}.pdf`,
      true
    );
  }
  @Get('auditorias/:id/historial') @Header('Cache-Control', 'no-store') historial(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('pagina') pagina = '1'
  ) {
    return this.servicio.historial(id, Number(pagina));
  }
  @Get('auditorias/:id/historial/:evento')
  @Header('Cache-Control', 'no-store')
  cambioHistorial(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('evento', ParseIntPipe) evento: number
  ) {
    return this.servicio.cambioHistorial(id, evento);
  }
  @Get('equipo') @Header('Cache-Control', 'no-store') equipo() {
    return this.servicio.equipo();
  }
  @Get('entregas') @Header('Cache-Control', 'no-store') entregas(@Query('pagina') pagina = '1') {
    return this.servicio.entregas(Number(pagina));
  }
  @Post('entregas') entregar(@Body() p: EntregaPreDto) {
    return this.servicio.entregar(p);
  }
  @Get('entregas/:id/pdf') async constancia(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.archivo(
      res,
      await this.servicio.constancia(id),
      'application/pdf',
      'Constancia-entrega.pdf',
      true
    );
  }
  @Get('servicios') @Header('Cache-Control', 'no-store') servicios(@Query('buscar') buscar = '') {
    return this.servicio.catalogoServicios(buscar);
  }
  @Post('servicios') crearCup(@Body() p: CupPreDto) {
    return this.servicio.crearCup({ ...p });
  }
  @Get('notificaciones') @Header('Cache-Control', 'no-store') notificaciones() {
    return this.servicio.notificaciones();
  }
  @Patch('notificaciones/:id') verNotificacion(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicio.verNotificacion(id);
  }
  @Get('configuracion') @Header('Cache-Control', 'no-store') configuracion() {
    return this.servicio.configuracion();
  }
  @Patch('configuracion') configurar(@Body() p: ConfiguracionPreDto) {
    return this.servicio.configurar({ ...p });
  }
  @Get('resumen') @Header('Cache-Control', 'no-store') resumen(@Query() f: FiltrosPre) {
    return this.servicio.resumen(f);
  }
  @Get('alertas') @Header('Cache-Control', 'no-store') alertas(@Query() f: FiltrosPre) {
    return this.servicio.alertas(f);
  }
  @Get('reportes/excel') async excel(
    @Query() f: FiltrosPre,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.archivo(
      res,
      await this.servicio.excel(f),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Preauditoria.xlsx'
    );
  }
  @Get('reportes/actividad') @Header('Cache-Control', 'no-store') actividad(
    @Query() f: FiltrosPre,
    @Query('grupo') grupo = 'mes'
  ) {
    return this.servicio.actividad(f, grupo);
  }
  @Get('salarios/usuarios') @Header('Cache-Control', 'no-store') usuariosSalario() {
    return this.servicio.usuariosSalario();
  }
  @Get('salarios') @Header('Cache-Control', 'no-store') salarios(
    @Query('usuario') usuario?: string
  ) {
    return this.servicio.salarios(usuario === undefined ? undefined : Number(usuario));
  }
  @Post('salarios') guardarSalario(@Body() p: SalarioPreDto) {
    return this.servicio.guardarSalario({ ...p });
  }
  @Get('horas') @Header('Cache-Control', 'no-store') horas(@Query() f: FiltrosPre) {
    return this.servicio.horas(f);
  }
  @Post('horas/calculo') calcular(@Body() p: HoraPreDto) {
    return this.servicio.calcular({ ...p });
  }
  @Get('horas/excel') async excelHoras(
    @Query() f: FiltrosPre,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.archivo(
      res,
      await this.servicio.excelHoras(f),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Horas-extras.xlsx'
    );
  }
  @Post('horas') guardarHora(@Body() p: HoraPreDto) {
    return this.servicio.guardarHora(p);
  }
  @Post('horas/:id/eliminar') eliminarHora(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() p: VersionPreDto
  ) {
    return this.servicio.eliminarHora(id, p.version);
  }
  @Get('horas/:id/historial') @Header('Cache-Control', 'no-store') historialHora(
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.servicio.historialHora(id);
  }
  private archivo(res: Response, contenido: Buffer, tipo: string, nombre: string, inline = false) {
    res.set({
      'Content-Type': tipo,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${nombre}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(contenido);
  }
}
