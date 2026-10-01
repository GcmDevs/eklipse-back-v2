import { GcmContextCode } from '@common/domain/types';

export interface AddSopRadI {
  facturaId: number;
  facturaFileName: string;
  comprobanteFileName: string;
}

export interface VerifySopRadI {
  contextoCode: GcmContextCode;
  facturaId: number;
  isAprobado: boolean;
  observaciones: string | null;
}
