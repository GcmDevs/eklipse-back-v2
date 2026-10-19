import { CtmType } from '@common/domain/types';

export type TipoDocumentoCode = 1 | 2 | 3;

export class TipoDocumentoType extends CtmType<TipoDocumentoCode> {}

const documento = new TipoDocumentoType(1, 'DOCUMENTO');
const comprobanteEntrada = new TipoDocumentoType(2, 'COMPROBANTE DE ENTRADA');
const remisionEntrada = new TipoDocumentoType(3, 'REMISIÓN DE ENTRADA');

export const tipoDocumentoFactory = (tipoDocumento: TipoDocumentoCode) => {
  switch (tipoDocumento) {
    case 1:
      return documento;
    case 2:
      return comprobanteEntrada;
    case 3:
      return remisionEntrada;
  }
};

export const TIPOS_DOCUMENTO = { documento, comprobanteEntrada, remisionEntrada };
