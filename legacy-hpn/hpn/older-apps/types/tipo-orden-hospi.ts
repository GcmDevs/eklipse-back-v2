import { CtmType } from '@common/domain/types';

export type TipoOrdenHospiCode = 1 | 2 | 3 | 4;

const HOSPITALIZACION = new CtmType<TipoOrdenHospiCode>(1, ' HOSPITALIZACION');
const URGENCIAS_OBSERVACION = new CtmType<TipoOrdenHospiCode>(2, 'URGENCIAS OBSERVACION');
const TRASLADO = new CtmType<TipoOrdenHospiCode>(3, 'TRASLADO');
const HOSPITALIZACION_RECIEN_NACIDO = new CtmType<TipoOrdenHospiCode>(
  4,
  'HOSPITALIZACION RECIEN NACIDO'
);

export function tipoOrdenHospiFactory(code: TipoOrdenHospiCode): CtmType<TipoOrdenHospiCode> {
  switch (code) {
    case 1:
      return HOSPITALIZACION;
    case 2:
      return URGENCIAS_OBSERVACION;
    case 3:
      return TRASLADO;
    case 4:
      return HOSPITALIZACION_RECIEN_NACIDO;
  }
}

export const TIPO_ORDEN_HOSP_VALUES = [
  HOSPITALIZACION,
  URGENCIAS_OBSERVACION,
  TRASLADO,
  HOSPITALIZACION_RECIEN_NACIDO,
];

export const TIPO_ORDEN_HOSP = {
  HOSPITALIZACION,
  URGENCIAS_OBSERVACION,
  TRASLADO,
  HOSPITALIZACION_RECIEN_NACIDO,
};
