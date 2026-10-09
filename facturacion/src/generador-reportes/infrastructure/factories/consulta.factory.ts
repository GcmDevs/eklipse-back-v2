import { IngresoReportes, PacienteReportes } from '../../domain/consulta';

export interface FilaPacienteReportes {
  OID: number;
  PACNUMDOC: string;
  PACPRINOM: string | null;
  PACSEGNOM: string | null;
  PACPRIAPE: string | null;
  PACSEGAPE: string | null;
}

export interface FilaIngresoReportes {
  AINCONSEC: number;
  AINFECING: Date | string | null;
  ESTADO_INGRESO: string;
}

export function pacienteReportesFactory(fila: FilaPacienteReportes): PacienteReportes {
  return {
    documento: String(fila.PACNUMDOC).trim(),
    nombreCompleto: [fila.PACPRINOM, fila.PACSEGNOM, fila.PACPRIAPE, fila.PACSEGAPE]
      .map(valor => (valor ?? '').trim())
      .filter(Boolean)
      .join(' '),
  };
}

export function ingresoReportesFactory(fila: FilaIngresoReportes): IngresoReportes {
  return {
    consecutivo: Number(fila.AINCONSEC),
    fechaIngreso: fila.AINFECING instanceof Date ? fila.AINFECING.toISOString() : fila.AINFECING,
    estado: fila.ESTADO_INGRESO,
  };
}
