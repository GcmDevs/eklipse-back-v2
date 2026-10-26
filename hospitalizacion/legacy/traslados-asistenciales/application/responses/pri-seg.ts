interface CampoPendienteFinalizacion {
  campo: string;
  mensaje: string;
}

export interface SeccionPendienteFinalizacion {
  seccion: string;
  campos: CampoPendienteFinalizacion[];
}
