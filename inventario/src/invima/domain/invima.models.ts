export const RESULTADOS_INVIMA = [
  'PENDIENTE',
  'EXACTA',
  'CONFIRMADA',
  'REVISION',
  'SIN_COINCIDENCIAS',
  'INCOMPLETA',
] as const;
export type ResultadoInvima = (typeof RESULTADOS_INVIMA)[number];
export type CriterioInvima = 'CUM' | 'REGISTRO' | 'NOMBRE';
export type TipoProductoInvima = 'MEDICAMENTO' | 'DISPOSITIVO' | 'SIN_CLASIFICAR';
export interface MedicamentoInput {
  tipo?: TipoProductoInvima;
  nombre: string;
  cum?: string;
  registroSanitario?: string;
  laboratorio?: string;
  concentracion?: string;
  formaFarmaceutica?: string;
  presentacion?: string;
}
export interface FuenteInvima {
  id: string;
  nombre: string;
  dataset: string;
}
export interface CandidatoInvima {
  clave: string;
  fuenteId: string;
  dataset: string;
  url: string;
  cum: string | null;
  nombre: string;
  titular: string;
  registroSanitario: string;
  presentacion: string;
  formaFarmaceutica: string;
  estadoRegistro: string;
  estadoCum: string | null;
  grupo?: string;
  marca?: string;
  fechaExpedicion: string;
  fechaVencimiento: string;
  fechaActivo: string;
  fechaInactivo: string;
}
export interface PaginaCandidatos {
  offset: number;
  candidatos: CandidatoInvima[];
  hayMas: boolean;
}
export interface ConsultaFuente {
  fuente: FuenteInvima;
  criterio: CriterioInvima;
  where: string;
  actualizadaEn?: number;
  consultadaEn: string;
  error?: string;
  paginas: PaginaCandidatos[];
}
export interface EvidenciaInvima {
  consultas: ConsultaFuente[];
  advertencias: string[];
  seleccionado: CandidatoInvima | null;
}
