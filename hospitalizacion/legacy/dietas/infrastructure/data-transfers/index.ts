import {
  CondicionOfertaCode,
  DieEstadoCode,
  MotivoDevolucionDietaCode,
  OfertaCode,
} from '@lgc/die/domain/types';

export interface JornadaI {
  id: number;
  name: string;
  startTime: Date;
  endTime: Date;
  catalogs: OfertaI[];
}

export interface OfertaI {
  name: string;
  code: OfertaCode;
  type: { code: CondicionOfertaCode; forHumans: string };
  rows: DetalleOfertaI[];
}

export interface DetalleOfertaI {
  code: string;
  name: string;
  category?: string;
  price: number;
  tipo: string;
  consistencia: string;
}

export interface AnteriorEstadoDietaResponse {
  HPNESTANC: number;
  INCLUYEMERIENDA: boolean;
  TIPOMERIENDA: string;
}

export interface ContratoDiePacRes {
  OID: number;
  GDECODIGO: string;
}

export interface DietaEstadoResponse {
  OID: number;
  HPNESTANC: number;
  CODIGOSUBGRUPO: string;
  SUBGRUPO: string;
  CAMA: string;
  GPANOMPAC: string;
  GPAFECNAC: Date;
  GENUSUREG: number;
  TIPO: string;
  CONSISTENCIA: string;
  FECHA: Date;
  ESTADO: DieEstadoCode;
  OBSERVACION: string | null;
  MOTIVODEVOLUCION: MotivoDevolucionDietaCode | null;
  OBSERVACIONDEVOLUCION: string | null;
  ENAISLAMIENTO: boolean | null;
}
