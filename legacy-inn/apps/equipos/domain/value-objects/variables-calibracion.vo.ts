import { normalizeUppercaseText } from '@common/domain/value-objects';
import {
  CODIGOS_VALIDOS,
  OTROS_PREFIX,
  VariableCalibracionCodigo,
  VariableCalibracionCodigoForHumans,
} from '../enums';

type VariableItem = {
  tipo: VariableCalibracionCodigo | 'OTR';
  nombre?: string;
};

export class VariableCalibracion {
  private constructor(private readonly variables: VariableItem[]) {}

  static create(variables: VariableItem[] = []): VariableCalibracion {
    return new VariableCalibracion(
      variables.map(variable => ({
        ...variable,
        nombre: variable.nombre ? normalizeUppercaseText(variable.nombre) : undefined,
      }))
    );
  }

  static fromPrimitives(raw: string[] = []): VariableCalibracion {
    const variables: VariableItem[] = [];

    for (const entry of raw) {
      if (entry.startsWith(OTROS_PREFIX)) {
        variables.push({
          tipo: 'OTR',
          nombre: entry.slice(OTROS_PREFIX.length).trim(),
        });
      } else if (CODIGOS_VALIDOS.has(entry as VariableCalibracionCodigo)) {
        variables.push({ tipo: entry as VariableCalibracionCodigo });
      }
    }

    return new VariableCalibracion(variables);
  }

  toPrimitives(): string[] {
    return this.variables.map(v => (v.tipo === 'OTR' ? `${OTROS_PREFIX}${v.nombre}` : v.tipo));
  }

  getAllWithNombreLabel() {
    return this.getAll().map(v => {
      return {
        tipo: v.tipo,
        tipoNombre: VariableCalibracionCodigoForHumans[v.tipo],
        nombre: v?.nombre ?? null,
      };
    });
  }

  getAll(): VariableItem[] {
    return [...this.variables];
  }

  has(tipo: VariableCalibracionCodigo): boolean {
    return this.variables.some(v => v.tipo === tipo);
  }
}
