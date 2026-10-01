export type UnidadMedidaTemperaturaTypeCode = 1 | 2 | 3;

export class UnidadMedidaTemperaturaType {
  constructor(private code: UnidadMedidaTemperaturaTypeCode, private forHumans: string) {}

  public getCode(): UnidadMedidaTemperaturaTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const CELSIUS = new UnidadMedidaTemperaturaType(1, '°C');
export const FAHRENHEIT = new UnidadMedidaTemperaturaType(2, '°F');
export const KELVIN = new UnidadMedidaTemperaturaType(3, 'K');

export function unidadMedidaTemperaturaTypeFactory(
  code: UnidadMedidaTemperaturaTypeCode
): UnidadMedidaTemperaturaType {
  switch (code) {
    case 1:
      return CELSIUS;
    case 2:
      return FAHRENHEIT;
    case 3:
      return KELVIN;
  }
}

export const UNIDAD_MEDIDA_TEMPERATURA_VALUES = [CELSIUS, FAHRENHEIT, KELVIN];
