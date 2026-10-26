import { CtmType } from '@common/domain/types';

export type DestinoOrdenDespachoTypeCode = 0 | 1 | 2;

export class DestinoOrdenDespachoType extends CtmType<DestinoOrdenDespachoTypeCode> {}

const ALMACEN = new DestinoOrdenDespachoType(0, 'ALMACEN');
const AREA_SERVICIO = new DestinoOrdenDespachoType(1, 'AREA DE SERVICIO');
const DEPENDENCIA = new DestinoOrdenDespachoType(2, 'DEPENDENCIA');

export function destinoOrdenDespachoTypeFactory(
  code: DestinoOrdenDespachoTypeCode
): DestinoOrdenDespachoType {
  switch (code) {
    case 0:
      return ALMACEN;
    case 1:
      return AREA_SERVICIO;
    case 2:
      return DEPENDENCIA;
  }
}

export const DESTINO_ORDEN_DESPACHO = { ALMACEN, AREA_SERVICIO, DEPENDENCIA };
export const DESTINO_ORDEN_DESPACHO_VALUES = [ALMACEN, AREA_SERVICIO, DEPENDENCIA];
