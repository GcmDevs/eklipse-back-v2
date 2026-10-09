import { IngresoReportes, PacienteReportes } from '../../domain/consulta';

export interface FilaPacienteReportes {
  OID: number;
  PACNUMDOC: string;
  PACPRINOM: string | null;
  PACSEGNOM: string | null;
  PACPRIAPE: string | null;
  PACSEGAPE: string | null;
  GPAFECNAC: Date | string | null;
  SEXO: string | null;
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
    fechaNacimiento:
      fila.GPAFECNAC instanceof Date
        ? fila.GPAFECNAC.toISOString().slice(0, 10)
        : (fila.GPAFECNAC?.slice(0, 10) ?? null),
    sexo: fila.SEXO?.trim() || 'No registrado',
  };
}

export function ingresoReportesFactory(fila: FilaIngresoReportes): IngresoReportes {
  return {
    consecutivo: Number(fila.AINCONSEC),
    fechaIngreso: fila.AINFECING instanceof Date ? fila.AINFECING.toISOString() : fila.AINFECING,
    estado: fila.ESTADO_INGRESO,
  };
}
