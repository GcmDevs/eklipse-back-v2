import { CtmType } from '@common/domain/types';

export type SeguimientoDestinoCode = 1 | 2 | 3 | 4 | 5 | 6;

const DOMICILIO_CUIDADOR = new CtmType<SeguimientoDestinoCode>(1, 'Domicilio con cuidador');
const HOSPITALIZACION_DOMICILIARIA = new CtmType<SeguimientoDestinoCode>(
  2,
  'Hospitalizacion domiciliaria'
);
const UMH_HOGAR_GERIATRICO = new CtmType<SeguimientoDestinoCode>(3, 'UMH / hogar geriatrico');
const HOSPITAL_NIVEL_INFERIOR = new CtmType<SeguimientoDestinoCode>(
  4,
  'Hospital de nivel inferior'
);
const ICBF_SOCIAL = new CtmType<SeguimientoDestinoCode>(5, 'Institucion ICBF / Social');
const SIN_DESTINO = new CtmType<SeguimientoDestinoCode>(6, 'Sin destino definido');

export function seguimientoDestinoTypeFactory(
  code: SeguimientoDestinoCode
): CtmType<SeguimientoDestinoCode> {
  switch (code) {
    case 1:
      return DOMICILIO_CUIDADOR;
    case 2:
      return HOSPITALIZACION_DOMICILIARIA;
    case 3:
      return UMH_HOGAR_GERIATRICO;
    case 4:
      return HOSPITAL_NIVEL_INFERIOR;
    case 5:
      return ICBF_SOCIAL;
    case 6:
      return SIN_DESTINO;
  }
}

export const SEGUIMIENTO_DESTINO_VALUES = [
  DOMICILIO_CUIDADOR,
  HOSPITALIZACION_DOMICILIARIA,
  UMH_HOGAR_GERIATRICO,
  HOSPITAL_NIVEL_INFERIOR,
  ICBF_SOCIAL,
  SIN_DESTINO,
];

export const SEGUIMIENTO_DESTINO = {
  DOMICILIO_CUIDADOR,
  HOSPITALIZACION_DOMICILIARIA,
  UMH_HOGAR_GERIATRICO,
  HOSPITAL_NIVEL_INFERIOR,
  ICBF_SOCIAL,
  SIN_DESTINO,
};
