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
export const TIPOS_PRODUCTO_INVIMA = [
  'MEDICAMENTO',
  'DISPOSITIVO',
  'ALIMENTOS',
  'MEDICO_QUIRURGICOS',
  'ASEO_LIMPIEZA',
  'BEBIDAS_ALCOHOLICAS',
  'BIOLOGICOS',
  'COSMETICOS',
  'FITOTERAPEUTICO',
  'HOMEOPATICOS',
  'MEDICAMENTOS_OFICINALES',
  'ODONTOLOGICOS',
  'PLAGUICIDAS',
  'REACTIVO_DIAGNOSTICO',
  'REACTIVOS_IN_VITRO',
  'SUPLEMENTO_DIETARIO',
  'SIN_CLASIFICAR',
] as const;
export type TipoProductoInvima = (typeof TIPOS_PRODUCTO_INVIMA)[number];
export const esDispositivo = (tipo?: TipoProductoInvima) =>
  tipo === 'DISPOSITIVO' || tipo === 'MEDICO_QUIRURGICOS';
export const esMedicamento = (tipo?: TipoProductoInvima) => !tipo || tipo === 'MEDICAMENTO';
export const GRUPOS_REGISTROS: Partial<Record<TipoProductoInvima, string>> = {
  ALIMENTOS: 'ALIMENTOS',
  ASEO_LIMPIEZA: 'ASEO Y LIMPIEZA',
  BEBIDAS_ALCOHOLICAS: 'BEBIDAS ALCOHOLICAS',
  BIOLOGICOS: 'BIOLOGICOS',
  COSMETICOS: 'COSMETICOS',
  FITOTERAPEUTICO: 'FITOTERAPEUTICO',
  HOMEOPATICOS: 'HOMEOPATICOS',
  MEDICO_QUIRURGICOS: 'MEDICO QUIRURGICOS',
  MEDICAMENTOS_OFICINALES: 'MED. OFICINALES',
  ODONTOLOGICOS: 'ODONTOLOGICOS',
  PLAGUICIDAS: 'PLAGUICIDAS',
  REACTIVO_DIAGNOSTICO: 'REACTIVO DIAGNOSTICO',
  REACTIVOS_IN_VITRO: 'REACTIVOS  IN VITRO',
  SUPLEMENTO_DIETARIO: 'SUPLEMENTO DIETARIO',
};
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
  grupo?: string;
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
  expediente?: string;
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
