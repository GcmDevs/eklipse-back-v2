import { BaseApiResponse } from "@common/domain/types";
import { BaseShelteredController } from "@common/presentation/controllers";
import { ReporteActividadesGeneral, ReporteCronograma } from "@equipos/application";
import { ReportesActividadService } from "@equipos/application/services/actividades/reportes-actividad.service";
import { FilterReporteActividadesDto, FilterSumaryEstadosActividadByFechasDto } from "@equipos/presentation/dto";
import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";

@Controller('/v4/inn/equipos/dashboard')
export class DashboardController extends BaseShelteredController {
    constructor(
        private readonly reportesService: ReportesActividadService,
    ) {
        super();
    }

    @Get('/cronograma/:cronogramaId')
    async getReporteCronograma(
        @Param('cronogramaId', ParseIntPipe) cronogramaId: number,
    ): Promise<BaseApiResponse<ReporteCronograma>> {
        const reporte = await this.reportesService.getReporteCronograma(cronogramaId);
        return { data: reporte };
    }

    @Get('/cronograma/resumen/:cronogramaId')
    async getResumenCronograma(
        @Param('cronogramaId', ParseIntPipe) cronogramaId: number,
    ): Promise<BaseApiResponse<any>> {
        const reporte = await this.reportesService.getResumenCronograma(cronogramaId);
        return { data: reporte };
    }

    @Get('/actividades')
    async getReporteActividades(
        @Query() filters: FilterReporteActividadesDto,
    ): Promise<BaseApiResponse<ReporteActividadesGeneral>> {
        const reporte = await this.reportesService.getReporteActividadesGeneral(filters);
        return { data: reporte };
    }

    @Get('/actividades/estados/resumen')
    async getDashboardEstados(
        @Query() { fechaInicio, fechaFin }: FilterSumaryEstadosActividadByFechasDto,
    ): Promise<BaseApiResponse<any>> {
        const result = await this.reportesService
            .getSumaryEstadosActividadByFechas(fechaInicio, fechaFin);
        return { data: result };
    }

}
