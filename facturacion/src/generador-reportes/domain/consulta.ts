export interface PacienteReportes {
  documento: string;
  nombreCompleto: string;
}

export interface IngresoReportes {
  consecutivo: number;
  fechaIngreso: string | null;
  estado: string;
}

export interface ConsultaReportes {
  paciente: PacienteReportes | null;
  ingresos: IngresoReportes[];
}
