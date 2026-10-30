import { ValueTransformer } from 'typeorm';

export function jsonColumnTransformer<T>(): ValueTransformer {
  return {
    to: (value: T | null | undefined) =>
      value === null || value === undefined ? null : JSON.stringify(value),
    from: (value: string | null) => {
      if (value === null || value === undefined || value === '') return null;
      return JSON.parse(value) as T;
    },
  };
}
