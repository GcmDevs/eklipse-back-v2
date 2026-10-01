import { BadInputError } from '@common/domain/errors';
import { normalizeUppercaseText } from '@common/domain/value-objects';
import { TipoMedidaCodigo } from '../enums';

export class Medida {
  private constructor(
    private readonly tipo: TipoMedidaCodigo,
    private readonly valor: number | null,
    private readonly valorMin: number | null,
    private readonly valorMax: number | null,
    private readonly unidadId: number | null,
    private readonly unidadNombre: string | null,
    private readonly nombre?: string
  ) {}

  static create(
    tipo: TipoMedidaCodigo,
    valor: number,
    unidadId: number,
    unidadNombre?: string,
    nombre?: string
  ): Medida {
    return new Medida(
      tipo,
      valor,
      null,
      null,
      unidadId,
      unidadNombre ? normalizeUppercaseText(unidadNombre) : null,
      nombre ? normalizeUppercaseText(nombre) : undefined
    );
  }

  static createRango(
    tipo: TipoMedidaCodigo,
    valorMin: number,
    valorMax: number,
    unidadId: number,
    unidadNombre?: string,
    nombre?: string
  ): Medida {
    if (valorMin > valorMax) {
      throw new BadInputError('El valor mínimo no puede ser mayor al máximo.');
    }

    return new Medida(
      tipo,
      null,
      valorMin,
      valorMax,
      unidadId,
      unidadNombre ? normalizeUppercaseText(unidadNombre) : null,
      nombre ? normalizeUppercaseText(nombre) : undefined
    );
  }

  static fromPrimitive(data: any): Medida {
    if (data.valorMin != null && data.valorMax != null) {
      return Medida.createRango(
        data.tipo,
        data.valorMin,
        data.valorMax,
        data.unidadId,
        data.unidadNombre,
        data.nombre
      );
    }

    return Medida.create(data.tipo, data.valor, data.unidadId, data.unidadNombre, data.nombre);
  }

  toPrimitive() {
    return {
      tipo: this.tipo,
      valor: this.valor,
      valorMin: this.valorMin,
      valorMax: this.valorMax,
      unidadId: this.unidadId,
      unidadNombre: this.unidadNombre,
      ...(this.isOtro ? { nombre: this.nombre } : {}),
    };
  }

  get isRango(): boolean {
    return this.valorMin !== null && this.valorMax !== null;
  }

  get isSimple(): boolean {
    return this.valor !== null;
  }

  get isOtro(): boolean {
    return this.tipo === TipoMedidaCodigo.OTROS;
  }

  get getTipo() {
    return this.tipo;
  }
  get getValor() {
    return this.valor;
  }
  get getValorMin() {
    return this.valorMin;
  }
  get getValorMax() {
    return this.valorMax;
  }
  get getUnidadId() {
    return this.unidadId;
  }
  get getUnidadNombre() {
    return this.unidadNombre;
  }
  get getNombre() {
    return this.nombre;
  }
}
