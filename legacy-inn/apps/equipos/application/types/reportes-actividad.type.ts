import { EstadoActividad, EstadoCronograma, TipoActividad } from '@equipos/domain/enums';
import { RegistroActividadRead } from '@equipos/domain/read';

export interface ResumenEstadoCronograma {
  estado: EstadoActividad;
  cantidad: number;
}

export interface ReporteCronograma {
  cronograma: {
    id: number;
    anio: number;
    mes: number;
    tipo: TipoActividad;
    estado: EstadoCronograma;
    metaCumplimientoPct: number;
  };
  totales: {
    programados: number;
    completados: number;
    reprogramados: number;
    cancelados: number;
    total: number;
  };
  cumplimientoPct: number;
  metaAlcanzada: boolean;
  porEstado: ResumenEstadoCronograma[];
  fechaGeneracion: Date;
}

export interface ReporteActividadesGeneral {
  filtros: {
    fechaInicio?: Date;
    fechaFin?: Date;
    tipo?: TipoActividad;
    estado?: EstadoActividad;
    equipoId?: number;
  };
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
  actividades: RegistroActividadRead[];
  fechaGeneracion: Date;
}
