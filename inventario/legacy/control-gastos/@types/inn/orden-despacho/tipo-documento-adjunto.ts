import { CtmType } from '@common/domain/types';

export type TipoDocumentoAdjuntoTypeCode = 1 | 2 | 3 | 4;

export class TipoDocumentoAdjuntoType extends CtmType<TipoDocumentoAdjuntoTypeCode> {}

const ORDEN_COMPRA = new TipoDocumentoAdjuntoType(1, 'ORDEN DE COMPRA');
const ORDEN_SERVICIO = new TipoDocumentoAdjuntoType(2, 'ORDEN DE SERVICIO');
const TRASLADO = new TipoDocumentoAdjuntoType(3, 'TRASLADO');
const FACTURA = new TipoDocumentoAdjuntoType(4, 'FACTURA');

export function tipoDocumentoAdjuntoTypeFactory(
  code: TipoDocumentoAdjuntoTypeCode
): TipoDocumentoAdjuntoType {
  switch (code) {
    case 1:
      return ORDEN_COMPRA;
    case 2:
      return ORDEN_SERVICIO;
    case 3:
      return TRASLADO;
    case 3:
      return FACTURA;
  }
}

export const TIPOS_DOCUMENTO_ADJUNTO = { ORDEN_COMPRA, ORDEN_SERVICIO, TRASLADO, FACTURA };

export const TIPOS_DOCUMENTO_ADJUNTO_VALUES = Object.values(TIPOS_DOCUMENTO_ADJUNTO);
