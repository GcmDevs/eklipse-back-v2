export interface PacienteReportes {
  documento: string;
  nombreCompleto: string;
  fechaNacimiento: string | null;
  sexo: string;
}

export interface IngresoReportes {
  consecutivo: number;
  fechaIngreso: string | null;
  estado: string;
  reportes?: EjecucionReportes;
}

export interface ConsultaReportes {
  paciente: PacienteReportes | null;
  ingresos: IngresoReportes[];
}
import { EjecucionReportes } from './ejecucion';
