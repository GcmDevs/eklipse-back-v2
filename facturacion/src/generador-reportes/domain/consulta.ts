export interface PacienteReportes {
  documento: string;
  nombreCompleto: string;
  fechaNacimiento: string | null;
  sexo: string;
}

export interface CamaIngresoReportes {
  codigo: string | null;
  nombre: string | null;
  unidad: string | null;
}

export interface IngresoReportes {
  tipoIngreso?: string;
  activo?: boolean;
  cama?: CamaIngresoReportes | null;
  consecutivo: number;
  fechaIngreso: string | null;
  estado: string;
  reportes?: EjecucionReportes;
}

export interface ConsultaReportes {
  proceso?: ProcesoReportes;
  paciente: PacienteReportes | null;
  ingresos: IngresoReportes[];
}
import { EjecucionReportes } from './ejecucion';
import { ProcesoReportes } from './proceso';
