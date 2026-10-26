export type ClimaTypeCode = 1 | 2 | 3;

export class ClimaType {
  constructor(
    private code: ClimaTypeCode,
    private forHumans: string
  ) {}

  public getCode(): ClimaTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const DESPEJADO = new ClimaType(1, 'Despejado');
export const LLUVIA = new ClimaType(2, 'Lluvia');
export const NIEBLA = new ClimaType(3, 'Niebla');

export function climaTypeFactory(code: ClimaTypeCode): ClimaType {
  switch (code) {
    case 1:
      return DESPEJADO;
    case 2:
      return LLUVIA;
    case 3:
      return NIEBLA;
    default:
      throw new Error('Código de clima no válido');
  }
}

export function recuperarClimaSegmentado(valor: unknown) {
  const texto = String(valor ?? '')
    .trim()
    .toUpperCase();
  if (!texto) return null;
  const opcion = CLIMAS_VALUES.find(
    item => String(item.getCode()) === texto || item.getForHumans().toUpperCase() === texto
  );
  if (!opcion) {
    throw new Error(
      'El clima guardado no corresponde a un código válido (1: Despejado, 2: Lluvia, 3: Niebla).'
    );
  }
  return opcion.getCode();
}

export const CLIMAS = { DESPEJADO, LLUVIA, NIEBLA };
export const CLIMAS_VALUES = [DESPEJADO, LLUVIA, NIEBLA];
