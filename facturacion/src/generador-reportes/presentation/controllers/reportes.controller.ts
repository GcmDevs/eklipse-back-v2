import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
} from '@nestjs/common';
import { Request } from 'express';
import { createReadStream } from 'node:fs';
import { JWTServices } from '@common/application/services';
import { ApiTags } from '@nestjs/swagger';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { SLN_AUTHORITIES } from '@inn/authorities';
import { GeneradorReportesImpl } from '../../infrastructure/services/reportes.impl';
import { BusquedaReportesDto, ConsultaReportesResponse } from '../dtos/busqueda.dto';
import { GeneracionReportesDto } from '../dtos/generacion.dto';
import {
  EjecucionesReportesImpl,
  PropietarioReportes,
} from '../../infrastructure/services/ejecuciones.impl';

@ApiTags('Generador de reportes')
@CommonGuards()
@Controller('v1/generador-reportes')
export class GeneradorReportesController {
  constructor(
    private readonly servicio: GeneradorReportesImpl,
    private readonly ejecuciones: EjecucionesReportesImpl
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async consultar(
    @Query() busqueda: BusquedaReportesDto,
    @Req() request: Request
  ): Promise<ConsultaReportesResponse> {
    const consulta = await this.servicio.consultar(busqueda.documento);
    if (!consulta.paciente || !consulta.ingresos.length) return consulta;
    // La consulta clínica delimita los ingresos a los que se pueden asociar los PDF guardados.
    const reportes = await this.ejecuciones.listar(
      consulta.paciente.documento,
      consulta.ingresos.map(ingreso => String(ingreso.consecutivo)),
      this.propietario(request)
    );
    const porIngreso = new Map(reportes.map(reporte => [reporte.ingreso, reporte]));
    return {
      ...consulta,
      ingresos: consulta.ingresos.map(ingreso => {
        const reporte = porIngreso.get(String(ingreso.consecutivo));
        return reporte ? { ...ingreso, reportes: reporte } : ingreso;
      }),
    };
  }

  private propietario(request: Request): PropietarioReportes {
    const token = JWTServices.decodeToken(request.headers.authorization.split(' ')[1]);
    return { usuario: token.user.id, contexto: token.context.getCode(), esDinamica: token.isDim };
  }

  @Post('ejecuciones')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async generar(@Body() datos: GeneracionReportesDto, @Req() request: Request) {
    const consulta = await this.servicio.consultar(datos.documento);
    if (
      !consulta.paciente ||
      !consulta.ingresos.some(ingreso => String(ingreso.consecutivo) === datos.ingreso)
    ) {
      throw new BadRequestException('El ingreso seleccionado no pertenece al paciente consultado.');
    }
    return this.ejecuciones.crear(
      consulta.paciente.documento,
      datos.ingreso,
      this.propietario(request)
    );
  }

  @Get('ejecuciones/:id')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public estado(@Param('id') id: string, @Req() request: Request) {
    return this.ejecuciones.consultar(id, this.propietario(request));
  }

  @Get('ejecuciones/:id/archivos/:archivo')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async descargar(
    @Param('id') id: string,
    @Param('archivo') archivo: string,
    @Req() request: Request
  ) {
    const resultado = await this.ejecuciones.archivo(id, archivo, this.propietario(request));
    return new StreamableFile(createReadStream(resultado.ruta), {
      type: 'application/pdf',
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(resultado.nombre)}`,
    });
  }

  @Get('ejecuciones/:id/archivos')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async descargarTodos(@Param('id') id: string, @Req() request: Request) {
    const resultado = await this.ejecuciones.archivos(id, this.propietario(request));
    return new StreamableFile(resultado.contenido, {
      type: 'application/zip',
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(resultado.nombre)}`,
    });
  }
}
