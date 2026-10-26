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
  TIPO_INGRESO?: string | null;
  INGRESO_ACTIVO?: boolean | number;
  CAMA_CODIGO?: string | null;
  CAMA_NOMBRE?: string | null;
  CAMA_UNIDAD?: string | null;
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
  const activo = fila.INGRESO_ACTIVO === true || fila.INGRESO_ACTIVO === 1;
  const codigo = fila.CAMA_CODIGO?.trim() || null;
  const nombre = fila.CAMA_NOMBRE?.trim() || null;
  return {
    activo,
    cama:
      activo && (codigo || nombre)
        ? { codigo, nombre, unidad: fila.CAMA_UNIDAD?.trim() || null }
        : null,
    consecutivo: Number(fila.AINCONSEC),
    fechaIngreso: fila.AINFECING instanceof Date ? fila.AINFECING.toISOString() : fila.AINFECING,
    estado: fila.ESTADO_INGRESO,
    tipoIngreso: fila.TIPO_INGRESO?.trim() || 'Desconocido',
  };
}
