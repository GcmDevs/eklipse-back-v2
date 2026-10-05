import { safeParseJson } from './json';

interface ToNumberOptions {
  default?: number;
  min?: number;
  max?: number;
}

export function trim(value: string): string {
  return value ? value.trim() : value;
}

export function toDate(value: string): Date {
  return new Date(value);
}

export function toNumericArray(value: string): number[] {
  value = value.replace(/[^,0-9 ]/g, '');
  return value.split(',').map(Number);
}

export function toStringArray(value: string | string[]): string[] {
  if (typeof value === 'string') {
    const parsed = safeParseJson<string[]>(value, []);
    return parsed.map(el => el.toString());
  }

  return value;
}

export function stringArrayForSqlQueries(value: string | string[]): string {
  let data = '';
  if (typeof value === 'string') {
    data = `'${value}'`;
  } else {
    value.forEach((el, i) => {
      if (!i) data = `'${el}'`;
      else data = `${data}, '${el}'`;
    });
  }

  return data;
}

export function numberArrayForSqlQueries(value: number | number[]): string {
  let data = '';

  if (typeof +value === 'number') value = [value as number];

  (value as number[]).forEach((el, i) => {
    if (!i) data = `${el}`;
    else data = `${data}, ${el}`;
  });

  return data;
}

export function toBoolean(value: string): boolean {
  value = value.toLowerCase();

  return value === 'true' || value === '1' ? true : false;
}

export function toNumber(value: string, opts: ToNumberOptions = {}): number {
  let newValue: number = Number.parseInt(value || String(opts.default), 10);

  if (Number.isNaN(newValue)) {
    newValue = opts.default;
  }

  if (opts.min) {
    if (newValue < opts.min) {
      newValue = opts.min;
    }

    if (newValue > opts.max) {
      newValue = opts.max;
    }
  }

  return newValue;
}

export function toStringOrNumericArray(
  value: string[] | number[],
  isNumeric = false
): string[] | number[] {
  let result: string[] | number[] = [];

  if (typeof value === 'string') {
    result = safeParseJson<string[]>(value, []).map(_ => _.toString());
  } else {
    result = value;
  }

  if (isNumeric)
    result = result.map((el: number | string) => {
      return +el;
    });

  return result;
}

export function concat(strArr: string[]) {
  let res = '';
  strArr.forEach(str => {
    if (str) {
      if (res) res += ' ';
      res += str.trim();
    }
  });
  return res;
}

export const enumToString = (object: object) => {
  return Object.keys(object)
    .map(key => object[key])
    .filter(value => typeof value === 'string') as string[];
};
