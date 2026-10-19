import { GcmContexts } from '@common/application/constants';
import { CtmType } from './base.type';

export type GcmContextCode = GcmContexts;

export class GcmContextType extends CtmType<GcmContextCode> {
  constructor(
    private ekKey: number,
    code: GcmContextCode,
    forHumans: string,
    abbreviation: string | undefined,
    private numericCode: number
  ) {
    super(code, forHumans, abbreviation);
  }

  public getEkKey(): number {
    return this.ekKey;
  }

  public getNumericCode(): number {
    return this.numericCode;
  }
}

const SANJUAN = new GcmContextType(5, GcmContexts.SANJUAN, 'San Juan Bautista', 'SJ', 4);
const EKLIPSE = new GcmContextType(99, GcmContexts.EKLIPSE, 'Eklipse GCM (Common DB)', 'EK', 99);
const AGUACHICA = new GcmContextType(
  3,
  GcmContexts.AGUACHICA,
  'Alta complejidad (Aguachica)',
  'AGU',
  1
);
const AMMEDICAL = new GcmContextType(4, GcmContexts.AMMEDICAL, 'AMMedical', 'AM', 3);
const ALTACENTRO = new GcmContextType(
  1,
  GcmContexts.ALTACENTRO,
  'Centro/Alta complejidad',
  'CM/AC',
  2
);
const VALLEDUPAR = new GcmContextType(6, GcmContexts.VALLEDUPAR, 'Clinica Valledupar', 'VDP', 5);
const DEVELOPMENT = new GcmContextType(
  98,
  GcmContexts.DEVELOPMENT,
  'Sistemas & Desarrollo',
  'DEV',
  98
);

export function gcmContextFactory(code: GcmContextCode): GcmContextType {
  switch (code) {
    case GcmContexts.SANJUAN:
      return SANJUAN;
    case GcmContexts.EKLIPSE:
      return EKLIPSE;
    case GcmContexts.AGUACHICA:
      return AGUACHICA;
    case GcmContexts.AMMEDICAL:
      return AMMEDICAL;
    case GcmContexts.ALTACENTRO:
      return ALTACENTRO;
    case GcmContexts.VALLEDUPAR:
      return VALLEDUPAR;
    case GcmContexts.DEVELOPMENT:
      return DEVELOPMENT;
    default:
      throw new Error('No existe contexto con este codigo');
  }
}

export const GCM_CONTEXTS = {
  AGUACHICA,
  ALTACENTRO,
  AMMEDICAL,
  DEVELOPMENT,
  EKLIPSE,
  SANJUAN,
  VALLEDUPAR,
};

export const GCM_CONTEXTS_VALUES = [
  ALTACENTRO,
  AGUACHICA,
  AMMEDICAL,
  DEVELOPMENT,
  EKLIPSE,
  SANJUAN,
  VALLEDUPAR,
];

export const ALL_CONTEXTS_WITH_AUTHORITIES = [
  AGUACHICA,
  ALTACENTRO,
  AMMEDICAL,
  SANJUAN,
  VALLEDUPAR,
];

/** @deprecated */
export const addAbreviacionByCentro = (context: GcmContextType, id: number, centroId?: number) => {
  switch (context) {
    case GCM_CONTEXTS.AGUACHICA:
      return `${GCM_CONTEXTS.AGUACHICA.getAbbreviation()}${id}`;
    case GCM_CONTEXTS.AMMEDICAL:
      return `${GCM_CONTEXTS.AMMEDICAL.getAbbreviation()}${id}`;
    case GCM_CONTEXTS.SANJUAN:
      return `${GCM_CONTEXTS.SANJUAN.getAbbreviation()}${id}`;
    case GCM_CONTEXTS.VALLEDUPAR:
      return `${GCM_CONTEXTS.VALLEDUPAR.getAbbreviation()}${id}`;
    case GCM_CONTEXTS.ALTACENTRO: {
      if (centroId === 1) return `CM${id}`;
      else return `AC${id}`;
    }
  }
};

export const additionalDataByCentro = (context: GcmContextType, id?: number, centroId?: number) => {
  switch (context) {
    case GCM_CONTEXTS.AGUACHICA:
      return {
        abreviattion: `${GCM_CONTEXTS.AGUACHICA.getAbbreviation()}${id || ''}`,
        nit: '900772387',
        alias1: 'AGUACHICA',
      };
    case GCM_CONTEXTS.AMMEDICAL:
      return {
        abreviattion: `${GCM_CONTEXTS.AMMEDICAL.getAbbreviation()}${id || ''}`,
        alias1: 'AMMEDICAL',
      };
    case GCM_CONTEXTS.SANJUAN:
      return {
        abreviattion: `${GCM_CONTEXTS.SANJUAN.getAbbreviation()}${id || ''}`,
        nit: '900272582',
        alias1: 'SAN JUAN',
      };
    case GCM_CONTEXTS.VALLEDUPAR:
      return {
        abreviattion: `${GCM_CONTEXTS.VALLEDUPAR.getAbbreviation()}${id || ''}`,
        nit: '892300708',
        alias1: 'VALLEDUPAR',
      };
    case GCM_CONTEXTS.ALTACENTRO: {
      if (centroId === 1)
        return { abreviattion: `CM${id || ''}`, nit: '824001041', alias1: 'CLINICA MEDICOS' };
      else return { abreviattion: `AC${id || ''}`, nit: '9006124131', alias1: 'ALTA COMPLEJIDAD' };
    }
  }
};
