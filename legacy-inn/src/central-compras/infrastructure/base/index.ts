export * from './central-compras.source';
export * from './timer/timer';
export * from './cotizacion-prefabricada.base-source';

export const formatMoney = (number: number, round = true): string => {
  if (typeof number === 'number') {
    const numberFt = round ? Math.ceil(number) : number;
    return Intl.NumberFormat('en-US').format(numberFt);
  } else {
    return number;
  }
};

export function toStringOrNumericArray(
  value: string[] | number[],
  isNumeric = false
): string[] | number[] {
  let result: string[] | number[] = [];

  if (typeof value === 'string') {
    value = JSON.parse(value);
    result = (value as string[]).map(_ => _.toString());
  } else {
    result = value;
  }

  if (isNumeric)
    result = result.map((el: number | string) => {
      return +el;
    });

  return result;
}
