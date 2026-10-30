import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
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
import { HistorialReportesDto } from '../dtos/historial.dto';
import { IngresoReportes } from '../../domain/consulta';
import {
  ColaReportes,
  EjecucionReportes,
  FiltrosHistorialReportes,
  HistorialReportes,
} from '../../domain/ejecucion';
import {
  ingresoElegibleParaProceso,
  ingresoVisibleParaProceso,
  ProcesoReportes,
} from '../../domain/proceso';
import {
  EjecucionesReportesImpl,
  PropietarioReportes,
} from '../../infrastructure/services/ejecuciones.impl';

@ApiTags('AUDITOR-IA')
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
    const ingresos = consulta.ingresos.filter(ingreso =>
      ingresoVisibleParaProceso(ingreso, busqueda.proceso)
    );
    if (!consulta.paciente || !ingresos.length)
      return { ...consulta, proceso: busqueda.proceso, ingresos };
    // La consulta clínica delimita los ingresos a los que se pueden asociar los PDF guardados.
    const propietario = this.propietario(request);
    const consecutivos = ingresos.map(ingreso => String(ingreso.consecutivo));
    const reportes = await this.ejecuciones.listar(
      consulta.paciente.documento, consecutivos, propietario, busqueda.proceso
    );
    const porIngreso = new Map(reportes.map(reporte => [reporte.ingreso, reporte]));
    return {
      ...consulta,
      proceso: busqueda.proceso,
      ingresos: ingresos.map(ingreso => {
        const reporte = porIngreso.get(String(ingreso.consecutivo));
        const elegible = ingresoElegibleParaProceso(ingreso, busqueda.proceso);
        const reportes =
          reporte && !elegible
            ? {
                ...reporte,
                disponibleParaProceso: false,
              }
            : reporte;
        return {
          ...ingreso,
          ...(reportes ? { reportes } : {}),
        };
      }),
    };
  }

  @Get('cola')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async cola(@Req() request: Request): Promise<ColaReportes> {
    const cola = await this.ejecuciones.consultarCola(this.propietario(request));
    return { ...cola, trabajos: await this.revalidarDisponibilidad(cola.trabajos) };
  }

  @Get('generados')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async generados(
    @Query() busqueda: HistorialReportesDto,
    @Req() request: Request
  ): Promise<HistorialReportes> {
    const filtros: FiltrosHistorialReportes = {
      ...(busqueda.busqueda ? { busqueda: busqueda.busqueda } : {}),
      ...(busqueda.documento ? { documento: busqueda.documento } : {}),
      ...(busqueda.ingreso ? { ingreso: busqueda.ingreso } : {}),
      ...(busqueda.proceso ? { proceso: busqueda.proceso } : {}),
      ...(busqueda.archivo ? { archivo: busqueda.archivo } : {}),
    };
    const historial = await this.ejecuciones.listarGenerados(
      this.propietario(request),
      busqueda.pagina,
      filtros
    );
    return { ...historial, reportes: await this.revalidarDisponibilidad(historial.reportes) };
  }

  private async revalidarDisponibilidad(
    trabajos: EjecucionReportes[]
  ): Promise<EjecucionReportes[]> {
    const consultas = new Map<string, ReturnType<GeneradorReportesImpl['consultar']>>();
    return Promise.all(
      trabajos.map(async ejecucion => {
        if (
          !ejecucion.proceso ||
          !ejecucion.disponibleParaProceso ||
          ejecucion.estado !== 'complete'
        )
          return ejecucion;
        let consultaPendiente = consultas.get(ejecucion.documento);
        if (!consultaPendiente) {
          consultaPendiente = this.servicio.consultar(ejecucion.documento);
          consultas.set(ejecucion.documento, consultaPendiente);
        }
        const consulta = await consultaPendiente;
        const ingreso = consulta.ingresos.find(
          ingreso => String(ingreso.consecutivo) === ejecucion.ingreso
        );
        return consulta.paciente &&
          ingreso &&
          ingresoElegibleParaProceso(ingreso, ejecucion.proceso)
          ? ejecucion
          : { ...ejecucion, disponibleParaProceso: false };
      })
    );
  }

  private validarProceso(ingreso: IngresoReportes, proceso: ProcesoReportes): void {
    if (ingresoElegibleParaProceso(ingreso, proceso)) return;
    const mensaje =
      proceso === 'pre-envio'
        ? 'Ingreso facturado: no disponible para auditoría pre-envío'
        : proceso === 'concurrente'
          ? 'La auditoría concurrente solo está disponible para ingresos activos.'
          : 'La conciliación solo está disponible para ingresos facturados.';
    throw new BadRequestException(mensaje);
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
    const ingreso = consulta.ingresos.find(
      ingreso => String(ingreso.consecutivo) === datos.ingreso
    );
    this.validarProceso(ingreso, datos.proceso);
    return this.ejecuciones.crear(
      consulta.paciente.documento,
      datos.ingreso,
      this.propietario(request),
      datos.proceso,
      undefined,
      ingreso.tipoIngreso?.trim() || 'Desconocido'
    );
  }

  @Get('ejecuciones/:id')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async estado(@Param('id') id: string, @Req() request: Request) {
    const ejecucion = await this.ejecuciones.consultar(id, this.propietario(request));
    return (await this.revalidarDisponibilidad([ejecucion]))[0];
  }

  @Post('ejecuciones/:id/reanudar')
  @Header('Cache-Control', 'no-store')
  @Authorities([SLN_AUTHORITIES.GENERADOR_REPORTES.CONSULTAR])
  public async reanudar(@Param('id') id: string, @Req() request: Request) {
    const propietario = this.propietario(request);
    const ejecucion = await this.ejecuciones.consultar(id, propietario);
    if (!ejecucion.proceso) {
      throw new ConflictException(
        'Los reportes anteriores son de consulta. Genera una nueva ejecución con el proceso seleccionado.'
      );
    }
    const consulta = await this.servicio.consultar(ejecucion.documento);
    if (
      !consulta.paciente ||
      !consulta.ingresos.some(ingreso => String(ingreso.consecutivo) === ejecucion.ingreso)
    ) {
      throw new BadRequestException(
        'El ingreso ya no está disponible para el paciente consultado.'
      );
    }
    this.validarProceso(
      consulta.ingresos.find(ingreso => String(ingreso.consecutivo) === ejecucion.ingreso),
      ejecucion.proceso
    );
    return this.ejecuciones.reanudar(id, propietario);
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
      length: resultado.bytes,
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
