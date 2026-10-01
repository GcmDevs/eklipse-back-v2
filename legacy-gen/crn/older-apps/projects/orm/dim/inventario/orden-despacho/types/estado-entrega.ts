export type EstadoEntregaOrdenDespachoTypeCode = 0 | 1 | 2 | 3;

export class EstadoEntregaOrdenDespachoType {
  constructor(private code: EstadoEntregaOrdenDespachoTypeCode, private forHumans: string) {}

  public getCode(): EstadoEntregaOrdenDespachoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const REGISTRADA = new EstadoEntregaOrdenDespachoType(0, 'REGISTRADA');
export const PENDIENTE = new EstadoEntregaOrdenDespachoType(1, 'PENDIENTE');
export const ENTREGADA = new EstadoEntregaOrdenDespachoType(2, 'ENTREGADA');
export const ANULADA = new EstadoEntregaOrdenDespachoType(3, 'ANULADA');

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

export const ESTADO_ENTREGA_ORDEN_DESPANCHO_VALUES = [REGISTRADA, PENDIENTE, ENTREGADA, ANULADA];
