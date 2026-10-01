import { GcmContextType } from '@common/domain/types';
import { JornadaType } from '@hpn/ori/die/domain/types/local';

export interface DataDieFPI {
  context: GcmContextType;
  combinacionCode: string;
  jornada: JornadaType;
  isMerienda?: boolean;
  isDietaFamiliar?: boolean;
}

export const TIPOS_SIN_VALOR = ['1', '2'];

export const TIPOS = ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];

export const CONSISTENCIAS_SIN_VALOR = ['17', '18'];

export const CONSISTENCIAS_SOLIDAS = ['19', '20', '21', '22'];

export const CONSISTENCIAS_LIQUIDAS = ['23', '24', '25', '26'];

export const MERIENDAS = ['27', '28'];

export const DIETAS_FAMILIARES = ['29'];

export const DIETAS_INEXISTENTES = ['1|17', '2|18', '1|18', '2|17'];
