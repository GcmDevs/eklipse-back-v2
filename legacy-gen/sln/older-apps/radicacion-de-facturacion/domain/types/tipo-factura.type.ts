import { CtmType } from '@common/domain/types';

export type TipoFacturaCode = 0 | 1 | 16;

export class TipoFacturaType extends CtmType<TipoFacturaCode> {}

const facturaPaciente = new TipoFacturaType(0, 'FACTURA PACIENTE');
const facturaEntidad = new TipoFacturaType(1, 'FACTURA ENTIDAD');
const facturaGlobalPFGP = new TipoFacturaType(1, 'FACTURA GLOBAL PFGP');

export const tipoFacturaTypeFactory = (value: TipoFacturaCode) => {
  switch (value) {
    case 0:
      return facturaPaciente;
    case 1:
      return facturaEntidad;
    case 16:
      return facturaGlobalPFGP;
  }
};

export const TIPOS_FACTURA = { facturaPaciente, facturaEntidad, facturaGlobalPFGP };

export const TIPOS_FACTURA_TYPES = [facturaPaciente, facturaEntidad, facturaGlobalPFGP];
