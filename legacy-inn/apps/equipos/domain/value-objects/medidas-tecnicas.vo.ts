import { TipoMedidaCodigo } from "../enums";
import { Medida } from "./medida.vo";

export class MedidasTecnicas {
  private constructor(
    private readonly medidas: Medida[]
  ) {}

  static create(medidas: Medida[] = []): MedidasTecnicas {
    return new MedidasTecnicas(medidas);
  }

  static fromPrimitives(data: any[]): MedidasTecnicas {
    if (!data) return this.create();

    return new MedidasTecnicas(
      data.map(dt => Medida.fromPrimitive(dt))
    );
  }

  toPrimitives() {
    return this.medidas.map(m => m.toPrimitive());
  }

  getByTipo(tipo: TipoMedidaCodigo): Medida | undefined {
    return this.medidas.find(m => m.getTipo === tipo);
  }

  add(medida: Medida): MedidasTecnicas {
    const filtradas = this.medidas.filter(m => m.getTipo !== medida.getTipo);
    return new MedidasTecnicas([...filtradas, medida]);
  }

  getAll(): Medida[] {
    return [...this.medidas];
  }

  isEmpty(): boolean {
    return this.medidas.length === 0;
  }
}
