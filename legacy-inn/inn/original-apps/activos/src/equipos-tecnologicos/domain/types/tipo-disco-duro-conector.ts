import { CtmType } from '@common/domain/types';

export type TipoDiscoDuroConectorCode = 1 | 2 | 3;

export class TipoDiscoDuroConectorType extends CtmType<TipoDiscoDuroConectorCode> {}

const ide = new TipoDiscoDuroConectorType(1, 'IDE');
const scsi = new TipoDiscoDuroConectorType(2, 'SCSI');
const sata = new TipoDiscoDuroConectorType(3, 'SATA');

export function tipoDiscoDuroConectorTypeFactory(
  code: TipoDiscoDuroConectorCode
): TipoDiscoDuroConectorType {
  switch (code) {
    case 1:
      return ide;
    case 2:
      return scsi;
    case 3:
      return sata;
  }
}

export const TIPO_CONECTOR_DISCO_DUROS = { ide, scsi, sata };

export const TIPO_CONECTOR_DISCODUROS_VALUES = [ide, scsi, sata];
