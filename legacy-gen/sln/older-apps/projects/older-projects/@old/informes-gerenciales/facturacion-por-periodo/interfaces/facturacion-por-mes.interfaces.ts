export interface IFecha {
  mes: string;
  anio: string;
}
export interface IFechaFormateada {
  inicio: string;
  fin: string;
}

export interface FacturacionPorMesPayload {
  centro1: number;
  centro2: number;
  fechas: [{ mes: string; anio: string }, { mes: string; anio: string }];
}
