import { DieEstadoCode, MotivoDevolucionDietaCode } from '@hpn/ori/die/domain/types/local';

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
