import { BadInputError } from '@common/domain/errors';

export interface ReglaObligatoriedadTipoActivoItem {
  tipoActivoId: number;
  esObligatorio: boolean;
}

export class ReglasObligatoriedadTipoActivo {
  private constructor(private readonly reglas: ReglaObligatoriedadTipoActivoItem[]) {}

  static create(reglas: ReglaObligatoriedadTipoActivoItem[]): ReglasObligatoriedadTipoActivo {
    if (!reglas.length) reglas = [];
    const ids = reglas.map(r => r.tipoActivoId);
    if (new Set(ids).size !== ids.length) {
      throw new BadInputError('No puede repetir tipoActivoId en las reglas del documento');
    }
    return new ReglasObligatoriedadTipoActivo([...reglas]);
  }

  static fromPrimitives(
    data?: ReglaObligatoriedadTipoActivoItem[] | null
  ): ReglasObligatoriedadTipoActivo {
    if (!data?.length) {
      return new ReglasObligatoriedadTipoActivo([]);
    }
    return ReglasObligatoriedadTipoActivo.create(data);
  }

  toPrimitives(): ReglaObligatoriedadTipoActivoItem[] {
    return this.reglas.map(r => ({ ...r }));
  }

  getReglas(): ReglaObligatoriedadTipoActivoItem[] {
    return this.toPrimitives();
  }

  aplicaParaTipoActivo(tipoActivoId: number): boolean {
    return this.reglas.some(r => r.tipoActivoId === tipoActivoId);
  }

  getEsObligatorioPara(tipoActivoId: number): boolean | undefined {
    return this.reglas.find(r => r.tipoActivoId === tipoActivoId)?.esObligatorio;
  }
}
