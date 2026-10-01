import { MedidasTecnicas } from "@equipos/domain/value-objects/medidas-tecnicas.vo";

export class DatosTecnicos {
  private constructor(
    private readonly medidas: MedidasTecnicas,
  ) { }

  static create(
    medidas: MedidasTecnicas = MedidasTecnicas.create()
  ): DatosTecnicos {
    return new DatosTecnicos(medidas);
  }

  get getMedidas(): MedidasTecnicas {
    return this.medidas;
  }
}
