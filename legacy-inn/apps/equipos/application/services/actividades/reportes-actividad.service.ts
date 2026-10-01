import { TimerServices } from "@common/application/services";
import { BadInputError, ResourceNotFoundError } from "@common/domain/errors";
import { ReporteActividadesGeneral, ReporteCronograma, ResumenEstadoCronograma } from "@equipos/application/types";
import { EstadoActividad } from "@equipos/domain/enums";
import { CRONOGRAMA_REPOSITORY, CronogramaRepository, REGISTRO_ACTIVIDAD_REPOSITORY, RegistroActividadRepository } from "@equipos/domain/repositories";
import { FilterReporteActividadesDto } from "@equipos/presentation/dto";
import { Inject, Injectable } from "@nestjs/common";


@Injectable()
export class ReportesActividadService {
    constructor(
        @Inject(REGISTRO_ACTIVIDAD_REPOSITORY)
        private readonly regActividadRepository: RegistroActividadRepository,
        @Inject(CRONOGRAMA_REPOSITORY)
        private readonly cronogramaRepository: CronogramaRepository,
    ) { }

    async getReporteCronograma(cronogramaId: number): Promise<ReporteCronograma> {
        const cronograma = await this.cronogramaRepository.findById(cronogramaId);
        if (!cronograma)
            throw new ResourceNotFoundError(`Cronograma con id: ${cronogramaId} no encontrado`);

        const raw = await this.regActividadRepository.countByEstadoForCronograma(
            cronograma.getAnio,
            cronograma.getMes,
            cronograma.getTipo,
        );

        const conteo = new Map<EstadoActividad, number>();
        raw.forEach((r) => conteo.set(r.estado, Number(r.total)));

        const programados = conteo.get(EstadoActividad.PROGRAMADO) ?? 0;
        const completados = conteo.get(EstadoActividad.COMPLETADO) ?? 0;
        const reprogramados = conteo.get(EstadoActividad.REPROGRAMADO) ?? 0;
        const cancelados = (conteo.get(EstadoActividad.ANULADO) ?? 0);
        const total = [...conteo.values()].reduce((a, b) => a + b, 0);

        const base = total - cancelados;
        const cumplimientoPct = base > 0
            ? Math.round((completados / base) * 10000) / 100
            : 0;

        const porEstado: ResumenEstadoCronograma[] = [...conteo.entries()].map(
            ([estado, cantidad]) => ({ estado, cantidad }),
        );

        return {
            cronograma: {
                id: cronograma.getId.getValor,
                anio: cronograma.getAnio,
                mes: cronograma.getMes,
                tipo: cronograma.getTipo,
                estado: cronograma.getEstado,
                metaCumplimientoPct: cronograma.getMetaCumplimientoPct,
            },
            totales: { programados, completados, reprogramados, cancelados, total },
            cumplimientoPct,
            metaAlcanzada: cumplimientoPct >= cronograma.getMetaCumplimientoPct,
            porEstado,
            fechaGeneracion: new Date(),
        };
    }

    async getReporteActividadesGeneral(
        filters: FilterReporteActividadesDto,
    ): Promise<ReporteActividadesGeneral> {
        if (filters.fechaInicio && filters.fechaFin) {
            const maxFin = new Date(filters.fechaInicio);
            maxFin.setMonth(maxFin.getMonth() + 3);
            if (filters.fechaFin > maxFin)
                throw new BadInputError(
                    'El rango para reportes generales no puede superar 3 meses',
                );
        }

        const fechaInicio = filters.fechaInicio
            ? TimerServices.normalizeDate(filters.fechaInicio)
            : undefined;
        const fechaFin = filters.fechaFin
            ? TimerServices.normalizeDate(filters.fechaFin)
            : undefined;

        const [actividades, total] = await this.regActividadRepository.findForReporte({
            fechaInicio,
            fechaFin,
            tipo: filters.tipo,
            estado: filters.estado,
            equipoId: filters.equipoId,
            origen: filters.origen,
            page: filters.page,
            limit: filters.limit,
        });

        const totalPages = Math.ceil(total / filters.limit);

        return {
            filtros: {
                fechaInicio,
                fechaFin,
                tipo: filters.tipo,
                estado: filters.estado,
                equipoId: filters.equipoId,
            },
            pagination: {
                total,
                totalPages,
                currentPage: filters.page,
                itemsPerPage: filters.limit,
            },
            actividades,
            fechaGeneracion: new Date(),
        };
    }

    async getResumenCronograma(cronogramaId: number): Promise<Record<string, ReporteCronograma>> {
        const cronograma = await this.cronogramaRepository.findById(cronogramaId);
        if (!cronograma) throw new ResourceNotFoundError(`Cronograma no encontrado`);

        const resultados: Record<string, ReporteCronograma> = {};
        const reporte = await this.getReporteCronograma(cronograma.getId.getValor);
        resultados[cronograma.getTipo] = reporte;
        return resultados;
    }

    public async getSumaryEstadosActividadByFechas(
        fechaInicio?: Date,
        fechaFin?: Date,
    ) {
        const { fechaInicio: finalFechaInicio, fechaFin: finalFechaFin } = this.resolveRangoFechas(fechaInicio, fechaFin, 3);
        fechaInicio = TimerServices.normalizeDate(finalFechaInicio);
        fechaFin = TimerServices.normalizeDate(finalFechaFin);

        const raw = await this.regActividadRepository
            .sumaryEstadosByFechas(finalFechaInicio, finalFechaFin);

        const summary: Record<EstadoActividad, number> = {
            [EstadoActividad.PROGRAMADO]: 0,
            [EstadoActividad.PENDIENTE]: 0,
            [EstadoActividad.RETRASADO]: 0,
            [EstadoActividad.REPROGRAMADO]: 0,
            [EstadoActividad.COMPLETADO]: 0,
            [EstadoActividad.ANULADO]: 0,
        };

        raw.forEach((rw) => {
            summary[rw.estado as EstadoActividad] = Number(rw.total);
        });

        return {
            summary,
            fechas: { fechaInicio: finalFechaInicio, fechaFin: finalFechaFin },
        };
    }

    private resolveRangoFechas(
        fechaInicio?: Date,
        fechaFin?: Date,
        maxMeses: number = 1,
    ): { fechaInicio: Date; fechaFin: Date } {

        if (fechaInicio && fechaFin) {
            const maxFin = new Date(fechaInicio);
            maxFin.setMonth(maxFin.getMonth() + maxMeses);

            if (fechaFin > maxFin) {
                throw new BadInputError(
                    `El rango de fechas seleccionado supera el máximo permitido de ${maxMeses} mes(es)`,
                );
            }

            return { fechaInicio, fechaFin };
        }

        if (!fechaInicio && !fechaFin) {
            fechaFin = new Date();
            fechaInicio = new Date(fechaFin);
            fechaInicio.setMonth(fechaInicio.getMonth() - maxMeses);
        } else if (!fechaInicio) {
            fechaInicio = new Date(fechaFin);
            fechaInicio.setMonth(fechaFin.getMonth() - maxMeses);

        } else {
            fechaFin = new Date(fechaInicio);
            fechaFin.setMonth(fechaInicio.getMonth() + maxMeses);
        }

        return { fechaInicio, fechaFin };
    }
}