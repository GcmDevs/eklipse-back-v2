import { CtmType } from '@common/domain/types';

export type EstadoEntregaOrdenDespachoTypeCode = 0 | 1 | 2 | 3;

export class EstadoEntregaOrdenDespachoType extends CtmType<EstadoEntregaOrdenDespachoTypeCode> {}

const REGISTRADA = new EstadoEntregaOrdenDespachoType(0, 'REGISTRADA');
const PENDIENTE = new EstadoEntregaOrdenDespachoType(1, 'PENDIENTE');
const ENTREGADA = new EstadoEntregaOrdenDespachoType(2, 'ENTREGADA');
const ANULADA = new EstadoEntregaOrdenDespachoType(3, 'ANULADA');

export function estadoEntregaOrdenDespachoTypeFactory(
  code: EstadoEntregaOrdenDespachoTypeCode
): EstadoEntregaOrdenDespachoType {
  switch (code) {
    case 0:
      return REGISTRADA;
    case 1:
      return PENDIENTE;
    case 2:
      return ENTREGADA;
    case 3:
      return ANULADA;
  }
}

export const ESTADOS_ENTREGA = { REGISTRADA, PENDIENTE, ENTREGADA, ANULADA };
export const ESTADOS_ENTREGA_VALUES = [REGISTRADA, PENDIENTE, ENTREGADA, ANULADA];
