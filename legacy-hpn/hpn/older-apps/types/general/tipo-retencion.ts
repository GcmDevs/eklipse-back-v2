import { CtmType } from '@common/domain/types';

export type TipoRetencionCode = 0 | 1 | 2 | 3;

const NINGUNA = new CtmType<TipoRetencionCode>(0, 'NINGUNA');
const EXCEPTO_RETENCION = new CtmType<TipoRetencionCode>(1, 'EXCEPTO DE RETENCIÓN');
const HACER_RETENCION = new CtmType<TipoRetencionCode>(2, 'HACER RETENCIÓN');
const AUTORETENEDOR = new CtmType<TipoRetencionCode>(3, 'AUTORETENEDOR');

export function tipoRetencionTypeFactory(code: TipoRetencionCode): CtmType<TipoRetencionCode> {
  switch (code) {
    case 0:
      return NINGUNA;
    case 2:
      return HACER_RETENCION;
    case 1:
      return EXCEPTO_RETENCION;
    case 3:
      return AUTORETENEDOR;
  }
}

export const TIPOS_RETENCION_VALUES = [NINGUNA, EXCEPTO_RETENCION, HACER_RETENCION, AUTORETENEDOR];

export const TIPOS_RETENCION = {
  NINGUNA,
  EXCEPTO_RETENCION,
  HACER_RETENCION,
  AUTORETENEDOR,
};
