import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type DestinoOrdenDespachoCode = 0 | 1 | 2;

export class DestinoOrdenDespachoType extends CtmType<DestinoOrdenDespachoCode> {}

const ALMACEN = new DestinoOrdenDespachoType(0, 'ALMACEN');
const AREA_SERVICIO = new DestinoOrdenDespachoType(1, 'AREA DE SERVICIO');
const DEPENDENCIA = new DestinoOrdenDespachoType(2, 'DEPENDENCIA');

export const destinosOrdenDespachoTypeFactory = (
  code: DestinoOrdenDespachoCode,
  throwErr = true
): DestinoOrdenDespachoType => {
  switch (code) {
    case 0:
      return ALMACEN;
    case 1:
      return AREA_SERVICIO;
    case 2:
      return DEPENDENCIA;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe destino de orden de despacho con este codigo');
      else return DEFAULT_TYPE;
    }
  }
};

export const DESTINOS_ORDEN_DESPACHO = { ALMACEN, AREA_SERVICIO, DEPENDENCIA };

export const DESTINOS_ORDEN_DESPACHO_VALUES = [ALMACEN, AREA_SERVICIO, DEPENDENCIA];
