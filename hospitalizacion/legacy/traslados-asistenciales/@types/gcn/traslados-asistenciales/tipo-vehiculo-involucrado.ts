export type TipoVehiculoInvolucradoTypeCode = 1 | 2 | 3 | 4 | 5;

export class TipoVehiculoInvolucradoType {
  constructor(
    private code: TipoVehiculoInvolucradoTypeCode,
    private forHumans: string
  ) {}

  public getCode(): TipoVehiculoInvolucradoTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const AUTOMOVIL = new TipoVehiculoInvolucradoType(1, 'Automóvil');
export const MOTOCICLETA = new TipoVehiculoInvolucradoType(2, 'Motocicleta');
export const CAMION = new TipoVehiculoInvolucradoType(3, 'Camión');
export const BICICLETA = new TipoVehiculoInvolucradoType(4, 'Bicicleta');
export const OTRO_VEHICULO = new TipoVehiculoInvolucradoType(5, 'Otro');

export function tipoVehiculoInvolucradoTypeFactory(
  code: TipoVehiculoInvolucradoTypeCode
): TipoVehiculoInvolucradoType {
  switch (code) {
    case 1:
      return AUTOMOVIL;
    case 2:
      return MOTOCICLETA;
    case 3:
      return CAMION;
    case 4:
      return BICICLETA;
    case 5:
      return OTRO_VEHICULO;
    default:
      throw new Error('Código de tipo-vehiculo-involucrado no válido');
  }
}

export function recuperarTipoVehiculoSegmentado(valor: unknown, vehiculoId: number) {
  const normalizar = (texto: string) =>
    texto
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
  const texto = normalizar(String(valor ?? ''));
  const opcion = TIPOS_VEHICULO_INVOLUCRADO_VALUES.find(
    item => String(item.getCode()) === texto || normalizar(item.getForHumans()) === texto
  );
  if (!opcion) {
    throw new Error(
      `El vehículo involucrado #${vehiculoId} tiene un tipo guardado inválido. Se requiere un código del 1 al 5.`
    );
  }
  return opcion.getCode();
}

export const TIPOS_VEHICULO_INVOLUCRADO = {
  AUTOMOVIL,
  MOTOCICLETA,
  CAMION,
  BICICLETA,
  OTRO_VEHICULO,
};
export const TIPOS_VEHICULO_INVOLUCRADO_VALUES = [
  AUTOMOVIL,
  MOTOCICLETA,
  CAMION,
  BICICLETA,
  OTRO_VEHICULO,
];
