import { CtmType } from '@common/domain/types';

export type TipoDocumentoCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export class TipoDocumentoType extends CtmType<TipoDocumentoCode> {}

const RADICACION = new TipoDocumentoType(0, 'RADICACION');
const RECEPCION_OBJECION = new TipoDocumentoType(1, 'RECEPCION OBJECION');
const TRAMITE_OBJECION = new TipoDocumentoType(2, 'TRAMITE OBJECION');
const CERTIFICACION_PAGO = new TipoDocumentoType(3, 'CERTIFICACION DE PAGO');
const OBJETO_NO_SUBSANABLE = new TipoDocumentoType(4, 'OBJETO NO SUBSANABLE');
const CUENTA_DIFICIL_RECAUDO = new TipoDocumentoType(5, 'CUENTA DE DIFICIL RECAUDO');
const CONCILIACION = new TipoDocumentoType(6, 'CONCILIACION');

export const tipoDocumentoTypeFactory = (tipo: TipoDocumentoCode) => {
  switch (tipo) {
    case 0:
      return RADICACION;
    case 1:
      return RECEPCION_OBJECION;
    case 2:
      return TRAMITE_OBJECION;
    case 3:
      return CERTIFICACION_PAGO;
    case 4:
      return OBJETO_NO_SUBSANABLE;
    case 5:
      return CUENTA_DIFICIL_RECAUDO;
    case 6:
      return CONCILIACION;
  }
};

export const TIPOS_DOCUMENTO = {
  RADICACION,
  RECEPCION_OBJECION,
  TRAMITE_OBJECION,
  CERTIFICACION_PAGO,
  OBJETO_NO_SUBSANABLE,
  CUENTA_DIFICIL_RECAUDO,
  CONCILIACION,
};

export const TIPOS_DOCUMENTO_VALUES = [
  RADICACION,
  RECEPCION_OBJECION,
  TRAMITE_OBJECION,
  CERTIFICACION_PAGO,
  OBJETO_NO_SUBSANABLE,
  CUENTA_DIFICIL_RECAUDO,
  CONCILIACION,
];
