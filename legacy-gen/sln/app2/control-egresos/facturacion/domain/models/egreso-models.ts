export interface EgresosResponse {
  egresos: Egreso[];
}

export interface Egreso {
  // Información básica del egreso
  NUMERO_INGRESO: number;
  NUMERO_EGRESO: number;
  SEDE: string;

  // Fechas principales
  FECHA_INGRESO: Date;
  FECHA_EGRESO: Date;

  // Información del paciente
  IDENTIFICACION: string;
  PACIENTE: string;
  EDAD: number;
  EPS: string;
  ADNCENATE: number;

  // Ubicación y área
  AREA_EGRESO: string;
  CODIGO_CAMA: string;
  NOMBRE_CAMA: string;
  CODIGO_SUBGRUPO: string;
  NOMBRE_SUBGRUPO: string;

  // Desglose temporal del egreso
  AÑO_EGRESO: number;
  MES_EGRESO: string;
  DIA_EGRESO: number;

  // Personal médico y administrativo
  INGRESO_POR: string;
  MEDICO_INDICO_SALIDA: string;
  ESPECIALIDAD_MEDICO: string;
  USUARIO_CREO_EGRESO: string;
  ROL_USUARIO: string;

  // Información quirúrgica y documentación
  CANT_PQX: number;
  ORDEN_SALIDA: number | null;
  FECHA_ORDEN_SALIDA: Date | null;
  NUMERO_EPICRISIS: number | null;
  FECHA_EPICRISIS: Date | null;

  ESTADO: string;
  ESTADO_PENDIENTE: string;
  ESTADO_ASIGNADO: string;

  MOTIVONOFACTURACION: number;
  OBSERVACIONPENDIENTE: string;

  TIPOCUENTA: number;
  OBSERVACIONASIGNAR: string;
  USUARIOASIGNADO: number;
  USUARIOASIGNADONOMBRE: string;
  FECHAREGISTROASIGNADO: Date | null;
  FECHAMOTIVONOFACTURACION: Date | null;
  ESTADO_CONTROL_GASTO: string;
  ESTADO_ADNINGRESO: number;
}
