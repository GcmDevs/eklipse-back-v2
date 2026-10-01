import { CtmType } from '@common/domain/types';

export type TipoFacturaCode = 0 | 1 | 16;

export class TipoFacturaType extends CtmType<TipoFacturaCode> {}

const FACTURA_PACIENTE = new TipoFacturaType(0, 'FACTURA PACIENTE');
const FACTURA_ENTIDAD = new TipoFacturaType(1, 'FACTURA ENTIDAD');
const FACTURA_GLOBAL_PFGP = new TipoFacturaType(16, 'FACTURA GLOBAL PFGP');

export const tipoFacturaTypeFactory = (value: TipoFacturaCode) => {
  switch (value) {
    case 0:
      return FACTURA_PACIENTE;
    case 1:
      return FACTURA_ENTIDAD;
    case 16:
      return FACTURA_GLOBAL_PFGP;
  }
};

export const TIPOS_FACTURA = { FACTURA_PACIENTE, FACTURA_ENTIDAD, FACTURA_GLOBAL_PFGP };

export const TIPOS_FACTURA_TYPES = [FACTURA_PACIENTE, FACTURA_ENTIDAD, FACTURA_GLOBAL_PFGP];
