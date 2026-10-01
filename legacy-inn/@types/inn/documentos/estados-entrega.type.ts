import { CtmType } from '@common/domain/types';

export type EstadoEntregaOrdenDespachoCode = 0 | 1 | 2 | 3;

export class EstadoEntregaOrdenDespachoType extends CtmType<EstadoEntregaOrdenDespachoCode> {}

const REGISTRADA = new EstadoEntregaOrdenDespachoType(0, 'REGISTRADA');
const PRENDIENTE_ENTREGA = new EstadoEntregaOrdenDespachoType(1, 'PRENDIENTE DE ENTREGA');
const ENTREGADA = new EstadoEntregaOrdenDespachoType(2, 'ENTREGADA');
const ANULADA = new EstadoEntregaOrdenDespachoType(3, 'ANULADA');

export function estadoEntregaOrdenDespachoTypeFactory(
  code: EstadoEntregaOrdenDespachoCode
): EstadoEntregaOrdenDespachoType {
  switch (code) {
    case 0:
      return REGISTRADA;
    case 1:
      return PRENDIENTE_ENTREGA;
    case 2:
      return ENTREGADA;
    case 3:
      return ANULADA;
  }
}

export const ESTADOS_ENTREGA_VALUES = [REGISTRADA, PRENDIENTE_ENTREGA, ENTREGADA, ANULADA];

export const ESTADOS_ENTREGA = {
  REGISTRADA,
  PRENDIENTE_ENTREGA,
  ENTREGADA,
  ANULADA,
};
