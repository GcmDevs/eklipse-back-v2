import { CtmType } from '@common/domain/types';

export type CierreDestinoFinalCode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DOMICILIO_CUIDADOR_ENTRENADO = new CtmType<CierreDestinoFinalCode>(
  1,
  'Domicilio con cuidador entrenado'
);
const HOSPITALIZACION_DOMICILIARIA_ACTIVA = new CtmType<CierreDestinoFinalCode>(
  2,
  'Hospitalizacion domiciliaria activa'
);
const UMH_HOGAR_GERIATRICO = new CtmType<CierreDestinoFinalCode>(3, 'UMH / hogar geriatrico');
const HOSPITAL_NIVEL_INFERIOR = new CtmType<CierreDestinoFinalCode>(
  4,
  'Hospital de nivel inferior'
);
const ICBF_SOCIAL = new CtmType<CierreDestinoFinalCode>(5, 'Institucion ICBF / Social');
const FALLECIMIENTO = new CtmType<CierreDestinoFinalCode>(6, 'Fallecimiento en hospitalizacion');
const OTRO = new CtmType<CierreDestinoFinalCode>(7, 'Otro');

export function cierreDestinoFinalTypeFactory(
  code: CierreDestinoFinalCode
): CtmType<CierreDestinoFinalCode> {
  switch (code) {
    case 1:
      return DOMICILIO_CUIDADOR_ENTRENADO;
    case 2:
      return HOSPITALIZACION_DOMICILIARIA_ACTIVA;
    case 3:
      return UMH_HOGAR_GERIATRICO;
    case 4:
      return HOSPITAL_NIVEL_INFERIOR;
    case 5:
      return ICBF_SOCIAL;
    case 6:
      return FALLECIMIENTO;
    case 7:
      return OTRO;
  }
}

export const CIERRE_DESTINO_FINAL_VALUES = [
  DOMICILIO_CUIDADOR_ENTRENADO,
  HOSPITALIZACION_DOMICILIARIA_ACTIVA,
  UMH_HOGAR_GERIATRICO,
  HOSPITAL_NIVEL_INFERIOR,
  ICBF_SOCIAL,
  FALLECIMIENTO,
  OTRO,
];

export const CIERRE_DESTINO_FINAL = {
  DOMICILIO_CUIDADOR_ENTRENADO,
  HOSPITALIZACION_DOMICILIARIA_ACTIVA,
  UMH_HOGAR_GERIATRICO,
  HOSPITAL_NIVEL_INFERIOR,
  ICBF_SOCIAL,
  FALLECIMIENTO,
  OTRO,
};
