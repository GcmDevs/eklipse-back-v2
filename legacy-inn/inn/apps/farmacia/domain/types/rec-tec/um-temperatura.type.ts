import { CtmType } from '@common/domain/types';

export type UMTemperaturaCode = 1 | 2 | 3;

export class UMTemperaturaType extends CtmType<UMTemperaturaCode> {}

const celcius = new UMTemperaturaType(1, '°C');
const fahrenheit = new UMTemperaturaType(2, '°F');
const kelvin = new UMTemperaturaType(3, '°K');

export function UMTemperaturaTypeFactory(code: UMTemperaturaCode): UMTemperaturaType {
  switch (code) {
    case 1:
      return celcius;
    case 2:
      return fahrenheit;
    case 3:
      return kelvin;
  }
}

export const UMTEMPERATURA = { celcius, fahrenheit, kelvin };

export const UMTEMPERATURA_VALUES = [celcius, fahrenheit, kelvin];
