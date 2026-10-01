import { CondicionOfertaCode, OfertaCode } from '@hpn/ori/die/domain/types/local';
export * from './fetch-dietas-by-fecha.data-transfers';
export * from './estado-dieta.response';

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
