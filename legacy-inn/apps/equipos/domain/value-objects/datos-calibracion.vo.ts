import { normalizeUppercaseText } from '@common/domain/value-objects';
import { VariableCalibracionCodigo } from '@equipos/domain/enums';
import { VariableCalibracion } from '@equipos/domain/value-objects/variables-calibracion.vo';

export class DatosCalibracion {
  private constructor(
    private readonly variables?: VariableCalibracion,
    private readonly codigoUltimaCalibracion?: string
  ) {}

  static create(
    variables?: VariableCalibracion,
    codigoUltimaCalibracion?: string
  ): DatosCalibracion {
    return new DatosCalibracion(
      variables,
      codigoUltimaCalibracion ? normalizeUppercaseText(codigoUltimaCalibracion) : undefined
    );
  }

  get getVariables(): VariableCalibracion {
    return this.variables;
  }

  get getCodigoUltimaCalibracion(): string | undefined {
    return this?.codigoUltimaCalibracion;
  }

  addVariable(variable: {
    tipo: VariableCalibracionCodigo | 'OTR';
    nombre?: string;
  }): DatosCalibracion {
    const nuevas = VariableCalibracion.create([...(this.variables?.getAll() ?? []), variable]);

    return new DatosCalibracion(nuevas, this.codigoUltimaCalibracion);
  }

  addVariableCatalogo(codigo: VariableCalibracionCodigo): DatosCalibracion {
    return this.addVariable({ tipo: codigo });
  }

  addVariableOtra(nombre: string): DatosCalibracion {
    return this.addVariable({ tipo: 'OTR', nombre });
  }
}
