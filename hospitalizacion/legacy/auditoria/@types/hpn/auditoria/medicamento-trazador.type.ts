import { CtmType } from '@common/domain/types';

export type MedicamentoTrazadorCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17;

export class MedicamentoTrazadorType extends CtmType<MedicamentoTrazadorCode> {}

const ALBUMINA = new MedicamentoTrazadorType(1, 'ALBUMINA');
const ANFOTERICINA_B_LIPOSOMAL = new MedicamentoTrazadorType(2, 'ANFOTERICINA B LIPOSOMAL');
const ANIDALOFUNGINA = new MedicamentoTrazadorType(3, 'ANIDALOFUNGINA');
const CASPOFUNGINA = new MedicamentoTrazadorType(4, 'CASPOFUNGINA');
const CEFTAZIDIMA_AVIBACTAM = new MedicamentoTrazadorType(5, 'CEFTAZIDIMA AVIBACTAM');
const CEFTOLOZANO_TAZOBACTAM = new MedicamentoTrazadorType(6, 'CEFTOLOZANO + TAZOBACTAM');
const DEXMEDETOMIDINA = new MedicamentoTrazadorType(7, 'DEXMEDETOMIDINA');
const ERTAPENEM = new MedicamentoTrazadorType(8, 'ERTAPENEM');
const FACTOR_VII = new MedicamentoTrazadorType(9, 'FACTOR VII');
const INMUNOGLOBULINA = new MedicamentoTrazadorType(10, 'INMUNOGLOBULINA');
const PLASMAFERESIS = new MedicamentoTrazadorType(11, 'PLASMAFERESIS');
const TIGECICLINA = new MedicamentoTrazadorType(12, 'TIGECICLINA');
const LEVOSIMENDAN = new MedicamentoTrazadorType(17, 'LEVOSIMENDAN');
const LINEZOLID = new MedicamentoTrazadorType(13, 'LINEZOLID');
const FOSFOMICINA = new MedicamentoTrazadorType(14, 'FOSFOMICINA');
const COLISTINA = new MedicamentoTrazadorType(15, 'COLISTINA');
const VONICONAZOL = new MedicamentoTrazadorType(16, 'VONICONAZOL');

export function medicamentoTrazadorTypeFactory(
  code: MedicamentoTrazadorCode
): MedicamentoTrazadorType {
  switch (code) {
    case 1:
      return ALBUMINA;
    case 2:
      return ANFOTERICINA_B_LIPOSOMAL;
    case 3:
      return ANIDALOFUNGINA;
    case 4:
      return CASPOFUNGINA;
    case 5:
      return CEFTAZIDIMA_AVIBACTAM;
    case 6:
      return CEFTOLOZANO_TAZOBACTAM;
    case 7:
      return DEXMEDETOMIDINA;
    case 8:
      return ERTAPENEM;
    case 9:
      return FACTOR_VII;
    case 10:
      return INMUNOGLOBULINA;
    case 11:
      return PLASMAFERESIS;
    case 12:
      return TIGECICLINA;
    case 13:
      return LINEZOLID;
    case 14:
      return FOSFOMICINA;
    case 15:
      return COLISTINA;
    case 16:
      return VONICONAZOL;
    case 17:
      return LEVOSIMENDAN;
  }
}

export const MEDICAMENTO_TRAZADOR_VALUES = [
  ALBUMINA,
  ANFOTERICINA_B_LIPOSOMAL,
  ANIDALOFUNGINA,
  CASPOFUNGINA,
  CEFTAZIDIMA_AVIBACTAM,
  CEFTOLOZANO_TAZOBACTAM,
  COLISTINA,
  DEXMEDETOMIDINA,
  ERTAPENEM,
  FACTOR_VII,
  FOSFOMICINA,
  INMUNOGLOBULINA,
  LEVOSIMENDAN,
  LINEZOLID,
  PLASMAFERESIS,
  TIGECICLINA,
  VONICONAZOL,
];

export const MEDICAMENTO_TRAZADOR = {
  ALBUMINA,
  ANFOTERICINA_B_LIPOSOMAL,
  ANIDALOFUNGINA,
  CASPOFUNGINA,
  CEFTAZIDIMA_AVIBACTAM,
  CEFTOLOZANO_TAZOBACTAM,
  DEXMEDETOMIDINA,
  ERTAPENEM,
  FACTOR_VII,
  INMUNOGLOBULINA,
  PLASMAFERESIS,
  TIGECICLINA,
  LEVOSIMENDAN,
  LINEZOLID,
  FOSFOMICINA,
  COLISTINA,
  VONICONAZOL,
};
