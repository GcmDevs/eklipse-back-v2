export interface GestionSalidaResponse {
  SALIDA_NUMERO: number;
  FECHA_HORA_SALIDA: Date;
  OBSERVACION: null;
  INGRESO: number;
  CAMA: string;
  SERVICIO: string;
  USUARIO_CREO_ORDEN_SALIDA: string;
  ID_USUARIO: number;
  NOMBRE_USUARIO: string;
  ROL: string;
  PACIENTE: string;
  NOMBRE_PACIENTE: string;
  FECHA_NAC_PACIENTE: Date;
  COD_PLAN: string;
  NOMBRE_PLAN: string;
}
export interface GestionSalida {
  numeroSalida: number;
  fechaHoraSalida: Date;
  observacion: string;
  ingreso: number;
  cama: string;
  servicio: string;
  usuario: {
    id: number;
    nombreUsuario: string;
    cedulaUsuario: string;
    rol: string;
  };
  paciente: { cedulaPaciente: string; nombrePaciente: string; fechaNacimiento: Date };
  plan: { codigoPlan: string; nombrePlan: string };
}
