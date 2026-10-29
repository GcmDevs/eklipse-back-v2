export const PERMISOS_PRE = {
  equipo: '004007001',
  recibir: '004007002',
  asignar: '004007003',
  auditar: '004007004',
  reabrir: '004007005',
  entregar: '004007006',
  informes: '004007007',
  configurar: '004007008',
  salarios: '004007009',
  horas: '004007010',
} as const;
export type PermisoPre = keyof typeof PERMISOS_PRE;
export interface Actor {
  id: number;
  nombre: string;
  contexto: string;
  permisos: string[];
}
export const ESTADOS_PRE = [
  'Sin asignar',
  'Pendiente',
  'En auditoría',
  'En espera de información',
  'En corrección',
  'Finalizado',
  'Entregado',
  'Anulado',
] as const;
export type EstadoPre = (typeof ESTADOS_PRE)[number];
export interface PacienteIngreso {
  oid: number;
  ingreso: string;
  pacienteId: number;
  nombre: string;
  documento: string;
  tipoDocumento: string;
  centroId: number;
  centro: string;
  fechaIngreso: string;
  fechaEgreso: string | null;
  entidadCodigo: string;
  entidad: string;
  estadoClinico: number;
}
export interface Hallazgo {
  id: string;
  codigo: string;
  especifica: string;
  general: string;
  servicioCodigo: string;
  servicio: string;
  cantidad: number | null;
  valorUnitario: number | null;
  motivo: string;
  area: string;
  descripcion: string;
  destino: 'ninguno' | 'preglosa' | 'porFacturar';
  preglosa: number | null;
  porFacturar: number | null;
}
export interface Solicitud {
  motivo: string;
  usuario: number;
  fecha: string;
}
export interface Auditoria {
  id: string;
  contexto: string;
  paciente: PacienteIngreso;
  valor: number;
  recibido: string;
  registrado: string;
  recibidoPor: number;
  responsableId: number | null;
  responsable: string;
  asignado: string | null;
  iniciado: string | null;
  auditado: string | null;
  ultimaFinalizacion: string | null;
  entregado: string | null;
  primeraEntrega: string | null;
  estado: EstadoPre;
  version: number;
  actualizado: string;
  notas: string;
  facturador: string;
  hallazgos: Hallazgo[];
  revision: number;
  correccion: boolean;
  esperaMotivo: string;
  esperaDesde: string | null;
  reapertura: Solicitud | null;
  reasignacion: Solicitud | null;
  correccionDesde: string | null;
  anulacionMotivo: string;
  prefactura: {
    sha256: string;
    bytes: number;
    metodo: 'automatico' | 'manual';
    netoDetectado: number | null;
    justificacion: string;
    identidadConfirmada: boolean;
  };
}
export interface Revision {
  id: string;
  auditoriaId: string;
  numero: number;
  fecha: string;
  responsable: string;
  formato: number;
  auditoria: Auditoria;
}
export interface Entrega {
  id: string;
  codigo: string;
  contexto: string;
  usuario: number;
  responsable: string;
  fecha: string;
  solicitud: string;
  total: number;
  items: {
    id: string;
    ingreso: string;
    centro: string;
    valor: number;
    auditor: string;
    auditado: string;
    revision: number;
  }[];
}
export interface FiltrosPre {
  buscar?: string;
  estado?: string;
  centro?: string;
  responsable?: string;
  desde?: string;
  hasta?: string;
  propios?: string;
  pagina?: string;
  tamano?: string;
}
export interface ConfiguracionPre {
  sinAsignar: number;
  auditoria: number;
  entrega: number;
}
export const CONFIGURACION_PRE: ConfiguracionPre = { sinAsignar: 24, auditoria: 24, entrega: 24 };
export interface Salario {
  usuario: number;
  vigencia: string;
  salario: number;
}
export interface HoraExtra {
  id: string;
  version: number;
  fecha: string;
  inicio: string;
  fin: string;
  diaSiguiente: boolean;
  descanso: number;
  divisor: number | null;
  recargoCompleto: boolean;
  nota: string;
  reportado: boolean;
  actualizado: string;
  calculo: CalculoHoras;
}
export interface SegmentoHora {
  fecha: string;
  minutos: number;
  nocturna: boolean;
  festivo: string;
  descanso: boolean;
  factor: number;
  divisor: number;
  salario: number;
  valor: number;
}
export interface CalculoHoras {
  inicio: number;
  fin: number;
  minutos: number;
  valor: number;
  segmentos: SegmentoHora[];
  regla: string;
}
