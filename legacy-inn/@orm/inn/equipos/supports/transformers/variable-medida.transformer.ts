import { VariableCalibracion } from '@equipos/domain/value-objects';
import { ValueTransformer } from 'typeorm';

export const variableMedidaTransformer: ValueTransformer = {
  to: (value?: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value?.toPrimitives === 'function') return JSON.stringify(value.toPrimitives());
    if (Array.isArray(value?.variables))
      return JSON.stringify(VariableCalibracion.create(value.variables).toPrimitives());
    return null;
  },

  from: (value?: string | null): VariableCalibracion => {
    try {
      const parsed = value ? JSON.parse(value) : [];
      return VariableCalibracion.fromPrimitives(Array.isArray(parsed) ? parsed : []);
    } catch {
      return VariableCalibracion.create();
    }
  },
};
