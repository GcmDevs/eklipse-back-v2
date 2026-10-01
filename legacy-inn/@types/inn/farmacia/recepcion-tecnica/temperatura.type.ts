import { CtmType } from '@common/domain/types';

export type TemperaturaCode = 1 | 2 | 3;

export class TemperaturaType extends CtmType<TemperaturaCode> {}

const CELCIUS = new TemperaturaType(1, '°C');
const FAHRENHEIT = new TemperaturaType(2, '°F');
const KELVIN = new TemperaturaType(3, '°K');

export function UMTemperaturaTypeFactory(code: TemperaturaCode): TemperaturaType {
  switch (code) {
    case 1:
      return CELCIUS;
    case 2:
      return FAHRENHEIT;
    case 3:
      return KELVIN;
  }
}

export const TEMPERATURAS = { CELCIUS, FAHRENHEIT, KELVIN };

export const TEMPERATURAS_VALUES = [CELCIUS, FAHRENHEIT, KELVIN];
