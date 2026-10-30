export const TANQUEOS_UMBRALES = {
  kmSaltoFactor: 1.5,
  kmSaltoRendimientoDefault: 8,
  capacidadTanqueMargenAlerta: 0.95,
  valorPagadoMinAlerta: 4_000,
  valorPagadoMaxAlerta: 10_000_000,
  cantidadCombustibleAlertaGal: 100,
  kilometrajeMax: 2 ** 32 - 1,
} as const;
