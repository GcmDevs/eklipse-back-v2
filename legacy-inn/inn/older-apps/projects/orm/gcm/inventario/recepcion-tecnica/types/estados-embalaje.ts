export type EstadosEmbalajeTypeCode = 1 | 2;

export class EstadosEmbalajeType {
  constructor(
    private code: EstadosEmbalajeTypeCode,
    private forHumans: string
  ) {}

  public getCode(): EstadosEmbalajeTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const BUEN_ESTADO = new EstadosEmbalajeType(1, 'EN BUEN ESTADO');
export const DETERIORADO = new EstadosEmbalajeType(2, 'DETERIORADO');

export function estadosEmbalajeTypeFactory(code: EstadosEmbalajeTypeCode): EstadosEmbalajeType {
  switch (code) {
    case 1:
      return BUEN_ESTADO;
    case 2:
      return DETERIORADO;
  }
}

export const ESTADOS_EMBALAJE_VALUES = [BUEN_ESTADO, DETERIORADO];
