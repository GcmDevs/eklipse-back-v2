import { GcmContextType } from '@common/domain/types';
import { JornadaType } from '@lgc/die/domain/types';

export interface DataDieFPI {
  context: GcmContextType;
  combinacionCode: string;
  jornada: JornadaType;
  isMerienda?: boolean;
  isDietaFamiliar?: boolean;
}

export type ConsistenciaType = 'SOLIDA' | 'LIQUIDA' | 'NO DEFINIDA';

export type ClasificacionType = 'familiar' | 'merienda' | 'solidos' | 'liquidos' | 'no definido';

export type JornadaLclType = 'desayuno' | 'almuerzo' | 'cena' | 'no definido';
