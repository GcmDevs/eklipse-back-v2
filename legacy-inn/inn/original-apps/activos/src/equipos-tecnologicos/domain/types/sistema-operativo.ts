import { CtmType } from '@common/domain/types';

export type SistemaOperativoCode = 1 | 2 | 3 | 4;

export class SistemaOperativoType extends CtmType<SistemaOperativoCode> {}

const Windows7 = new SistemaOperativoType(1, 'Windows 7');
const Windows10 = new SistemaOperativoType(2, 'WINDOWS 10 PRO 64 BITS');
const Windows11 = new SistemaOperativoType(3, 'WINDOWS 11 PRO 64 BITS');
const linux = new SistemaOperativoType(4, 'linux');

export function sistemaOperativoTypeFactory(code: SistemaOperativoCode): SistemaOperativoType {
  switch (code) {
    case 1:
      return Windows7;
    case 2:
      return Windows10;
    case 3:
      return Windows11;
    case 4:
      return linux;
  }
}

export const SISTEMA_OPERATIVOS = { Windows7, Windows10, Windows11, linux };

export const SISTEMA_OPERATIVOS_VALUES = [Windows7, Windows10, Windows11, linux];
