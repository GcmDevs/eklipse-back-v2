import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CommonGuards } from '@common/presentation/decorators';
import { CambiarEstadoCirugiaDto } from './dto/cambiar-estado-cirugia.dto';
import { RegistrarEventoCirugiaDto } from './dto/registrar-evento-cirugia.dto';
import { SeguimientoQuirurgicoImpl } from '../infraestructure/services/seguimiento-quirurgico.impl';
import { SeguimientoQuirurgicoGateway } from './seguimiento-quirurgico.gateway';
@CommonGuards()
@Controller('v1/hpn/seguimiento-quirurgico')
export class SeguimientoQuirurgicoController {
  constructor(private readonly service: SeguimientoQuirurgicoImpl, private readonly gateway: SeguimientoQuirurgicoGateway) {}
  @Get() listar() {
    return this.service.cirugias();
  }
  @Get('quirofanos') quirofanos() {
    return this.service.quirofanos();
  }
  @Get('agrupadores-salas') agrupadoresSalas() {
    return this.service.agrupadoresSalas();
  }
  @Post('agrupadores-salas') crearAgrupadorSalas(@Body() datos: { nombre: string; salas: string[] }) {
    return this.service.crearAgrupadorSalas(datos);
  }
  @Patch('agrupadores-salas/:id') actualizarAgrupadorSalas(
    @Param('id') id: string,
    @Body() datos: { nombre: string; salas: string[] },
  ) {
    return this.service.actualizarAgrupadorSalas(Number(id), datos);
  }
  @Get('publicas') publicas() {
    return this.service.publicas();
  }
  @Get('estados') estados() {
    return this.service.estados();
  }
  @Get('asignaciones/:usuarioDocumento') asignaciones(@Param('usuarioDocumento') usuarioDocumento: string) {
    return this.service.asignacionesUsuario(usuarioDocumento);
  }
  @Patch('asignaciones/:usuarioId') guardarAsignaciones(
    @Param('usuarioDocumento') usuarioDocumento: string,
    @Body() datos: { salaQx: string; usuarioDocumento?: string },
  ) {
    return this.service.guardarAsignacionesUsuario(usuarioDocumento, datos);
  }
  @Get('quirofano/:id') porQuirofano(@Param('id') id: string) {
    return this.service.cirugias(id);
  }
  @Patch(':id/estado') async cambiar(@Param('id') id: string, @Body() dto: CambiarEstadoCirugiaDto) {
    const result = await this.service.cambiarEstado(id, dto); this.gateway.publicar(id); return result;
  }
  @Patch(':id/evento') async evento(@Param('id') id: string, @Body() dto: RegistrarEventoCirugiaDto) {
    const result = await this.service.registrarEvento(id, dto.codigoEvento); this.gateway.publicar(id); return result;
  }
}
