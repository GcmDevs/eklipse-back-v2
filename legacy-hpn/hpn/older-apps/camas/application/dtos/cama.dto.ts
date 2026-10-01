import { CtmType } from '@common/domain/types';
import { EstadosCama, TipoCamas } from '../constants';

export interface EstadisticasCamaDto {
  nombre: string;
  ocupadas: EstadosCamaDto;
  desocupadas: EstadosCamaDto;
  alistamiento: EstadosCamaDto;
  bloqueadas: number;
  reservadas: number;
  inactivas: EstadosCamaDto;
}

export interface EstadosCamaDto {
  total: number;
  tipoCamas: TipoCamaDto;
}
export interface TipoCamaDto {
  camas: number;
  camillas: number;
  cunas: number;
  incubadora: number;
  sillonesexc: number;
  camillaexc: number;
  sillones?: number;
  cama?: number;
  incubadoras?: number;
  cuna?: number;
  trescamasomas?: number;
  unipersonal?: number;
  bipersonal?: number;
}
export interface CamaDto {
  id: number;
  codigo: string;
  estado: {
    codigo: EstadosCama;
    nombre: string;
  };
  paciente?: {
    id: number;
    nombre: string;
    cedula: string;
    eps: string;
    consecutivo: string;
    fechaIngreso: Date;
    sexo: string;
    fechaNacimiento: Date;
    diagnostico: string;
  };
  prealta?: boolean;
  centro: { id: number; nombre: string; contexto: string };
  habitacion: { numero: string };
  grupo: { id: number; codigo: string; nombre: string };
  subgrupo: { id: number; codigo: string; nombre: string };
  //solicitudId?: number;
  reserva?: SolicitanteModel;
  tipoCama: CtmType<TipoCamas>;
}
export interface CamaOcupadaDto {
  nombre: string;
  cedula: string;
  fecha: Date;
  eps: string;
  consecutivo: number;
}

export interface SolicitanteModel {
  CONSECUTIVO: number;
  FECHA_SOL: Date;
  ESTADO: string;
  PACIENTE_ACEPTADO: 'SI' | 'NO';
  PRIORIDAD: string;
  TIPO_DOC_PAC: string;
  SERVICIO_QUEREMITE: string;
  SERVICIO_ALQUEREMITE: string;
  NUM_DOCUMENTO: string;
  INGRESO: number | null;
  FECHA_INGRESO: Date | null;
  PACIENTE: string;
  EDAD: number;
  SEXO: 'F' | 'M';
  ENTI_REFERENCIA: string;
  EPS: string;
  MUNICIPIO: string;
  MEDICO: string;
  TRAMITE: number;
  MOT_REMI: string;
  MOT_REMI2: string;
  FUNCIONA_CONTESTA: string;
  OBS_SEGUIMIENTO: string;
  FEC_ACEPTACION: Date;
  OBS_CIERRE: string | null;
  ESPECIALIDAD: string;
  FECHA_TRASLADO_PAC: Date | null;
  CEDULA: string;
  NOMBRE: string;
  TIPOAILAMIENTO: string[];
  OBSERVACION: string;
}

export interface GestionSalidaDto {
  consecutivo: number;
  fechaSalida: Date;
  ingresoConsecutivo: number;
  usuCreoOrdenSalidaId: number;
}
