import { MedidasTecnicas } from '@equipos/domain/value-objects/medidas-tecnicas.vo';

export const medidasTransformer = {
  to: (value?: MedidasTecnicas): string => JSON.stringify(value?.toPrimitives() ?? []),

  from: (value?: string): MedidasTecnicas => {
    try {
      return MedidasTecnicas.fromPrimitives(value ? JSON.parse(value) : []);
    } catch {
      return MedidasTecnicas.create();
    }
  },
};
