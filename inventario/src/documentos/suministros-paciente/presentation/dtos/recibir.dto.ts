export class SumPacDto {
  id: number;
  cantidad: number;
  ordenId: number;
  recibidoPor: number;
  cantidadRecibida: number;
  cantidadRecibidaModificada: number;
}

export class SumPacModifiRecibiDto {
  id: number;
  usuario: {
    id: number;
    nombreCompleto: string;
    numeroDocumento: string;
  };
  createdAt: string;
}

export interface SumPacRecibidoPayload {
  id: number;
  cantidad: number;
}

export interface SumPacModifiRecibiPayload {
  ordenSuministros: number;
  suministros: SumPacRecibidoPayload[];
}
