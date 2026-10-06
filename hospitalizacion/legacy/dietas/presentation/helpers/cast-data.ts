interface ToNumberOptions {
  default?: number;
  min?: number;
  max?: number;
}

export function toLowerCase(value: string): string {
  return value.toLowerCase();
}

export function trim(value: string): string {
  return value.trim();
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
    value = JSON.parse(value);
    return (value as string[]).map(el => el.toString());
  } else {
    return value;
  }
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
