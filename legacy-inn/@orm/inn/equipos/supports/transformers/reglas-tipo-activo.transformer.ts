import {
  ReglaObligatoriedadTipoActivoItem,
  ReglasObligatoriedadTipoActivo,
} from '@equipos/domain/value-objects/reglas-obligatoriedad-tipo-activo.vo';
import { ValueTransformer } from 'typeorm';

export const reglasTipoActivoTransformer: ValueTransformer = {
  to: (value?: ReglasObligatoriedadTipoActivo | null): string | null => {
    if (!value?.getReglas().length) return null;
    return JSON.stringify(value.toPrimitives());
  },
  from: (value?: string | null): ReglasObligatoriedadTipoActivo => {
    try {
      const parsed = value ? (JSON.parse(value) as ReglaObligatoriedadTipoActivoItem[]) : [];
      if (!parsed.length) return ReglasObligatoriedadTipoActivo.fromPrimitives([]);
      return ReglasObligatoriedadTipoActivo.create(parsed);
    } catch {
      return ReglasObligatoriedadTipoActivo.fromPrimitives([]);
    }
  },
};
