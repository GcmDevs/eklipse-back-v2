export type TipoNovedad = 'AVERIA' | 'FALTANTE' | 'SOBRANTE' | 'NO_SOLICITADO';
export type MotivoRechazo = 'CUM' | 'INVIMA';
export interface InspeccionEntrada {
  cantidadFacturada: number;
  novedades: { tipo: TipoNovedad; cantidad: number }[];
  motivosRechazo: MotivoRechazo[];
  ium?: string;
  numeroResolucion?: string;
}
export interface InspeccionGuardada extends InspeccionEntrada {
  versionEsquema: 1;
  cantidadFisica: number;
  actualizadoPor: number;
  actualizadoEn: string;
}
export interface ProductoInspeccion {
  tipoProductoCode: number;
  cantidadErrores: number;
  estadoEmbalajeCode: number;
  verifiRegSanINVIMA: boolean;
  reviEtiquetaProducto: boolean;
  reviOrtografiaSellos: boolean;
  correspFabriExpediSani: boolean;
}
export const redondearCantidad = (n: number) => Math.round(n * 10000) / 10000;
export function validarCantidad(n: number, positiva = false): void {
  if (
    typeof n !== 'number' ||
    !Number.isFinite(n) ||
    n < 0 ||
    n > Number.MAX_SAFE_INTEGER ||
    (positiva && n === 0) ||
    Math.abs(n - redondearCantidad(n)) > 0.0000001
  )
    throw new Error(
      'Las cantidades deben ser números válidos no negativos, con hasta cuatro decimales.'
    );
}
// Misma tabla de muestreo utilizada por recepción técnica; la cantidad cero es N/A.
const MUESTREO: [number, string, number, number][] = [
  [8, 'A', 2, 1],
  [15, 'B', 3, 1],
  [26, 'C', 5, 1],
  [50, 'D', 8, 1],
  [90, 'E', 13, 1],
  [150, 'F', 20, 2],
  [280, 'G', 32, 3],
  [500, 'H', 50, 5],
  [1200, 'J', 80, 8],
  [3200, 'K', 125, 12],
  [10000, 'L', 200, 20],
  [25000, 'M', 315, 30],
  [150000, 'N', 500, 50],
  [500000, 'P', 800, 80],
  [Infinity, 'Q', 1250, 125],
];
export function calcularMuestreo(cantidad: number, errores: number) {
  if (!Number.isInteger(errores) || errores < 0)
    throw new Error('La cantidad de errores críticos no es válida.');
  if (cantidad === 0) return { nivel: 'N/A', muestra: 0, cumple: false };
  const [, nivel, muestra, limite] = MUESTREO.find(r => Math.ceil(cantidad) <= r[0])!;
  return { nivel, muestra, cumple: errores < limite };
}
export function leerInspeccion(json?: string | null): InspeccionGuardada | null {
  if (!json) return null;
  const data = JSON.parse(json);
  if (
    data.versionEsquema !== 1 ||
    !Array.isArray(data.novedades) ||
    !Array.isArray(data.motivosRechazo)
  )
    throw new Error('La inspección guardada tiene un formato incompatible.');
  return data;
}
export function normalizarInspeccion(
  entrada: InspeccionEntrada,
  producto: ProductoInspeccion,
  lotes: { cantidad: number; lote: string; fechaVencimiento: Date | string }[],
  usuario: number
) {
  validarCantidad(entrada.cantidadFacturada);
  if (![1, 2, 3, 4].includes(producto.tipoProductoCode))
    throw new Error('El tipo de producto no es válido.');
  const nombres = new Set<string>();
  let cantidadFisica = 0;
  for (const lote of lotes) {
    validarCantidad(lote.cantidad, true);
    const nombre = lote.lote?.trim();
    if (
      !nombre ||
      nombre.length > 20 ||
      nombres.has(nombre.toUpperCase()) ||
      !Number.isFinite(new Date(lote.fechaVencimiento).getTime())
    )
      throw new Error(
        'Revise las cantidades, nombres, fechas y duplicados de los lotes de inspección.'
      );
    nombres.add(nombre.toUpperCase());
    cantidadFisica = redondearCantidad(cantidadFisica + lote.cantidad);
  }
  validarCantidad(cantidadFisica);
  const novedades: InspeccionGuardada['novedades'] = [];
  const tipos = new Set<string>();
  for (const n of entrada.novedades || []) {
    if (!['AVERIA', 'FALTANTE', 'SOBRANTE', 'NO_SOLICITADO'].includes(n.tipo) || tipos.has(n.tipo))
      throw new Error('Las novedades no pueden repetirse y deben pertenecer al catálogo.');
    tipos.add(n.tipo);
    // Faltantes y sobrantes se reconstruyen; nunca se confía en el valor enviado.
    if (n.tipo === 'FALTANTE' || n.tipo === 'SOBRANTE') continue;
    validarCantidad(n.cantidad, true);
    if (n.cantidad > cantidadFisica)
      throw new Error('La cantidad de la novedad no puede superar la cantidad física recibida.');
    novedades.push({ tipo: n.tipo, cantidad: n.cantidad });
  }
  const diferencia = redondearCantidad(entrada.cantidadFacturada - cantidadFisica);
  if (diferencia)
    novedades.push({
      tipo: diferencia > 0 ? 'FALTANTE' : 'SOBRANTE',
      cantidad: Math.abs(diferencia),
    });
  const motivos = entrada.motivosRechazo || [];
  if (new Set(motivos).size !== motivos.length || motivos.some(m => !['CUM', 'INVIMA'].includes(m)))
    throw new Error('El motivo de rechazo no es válido.');
  const ium = (entrada.ium || '').trim();
  const numeroResolucion = (entrada.numeroResolucion || '').trim();
  if (ium.length > 100 || numeroResolucion.length > 100)
    throw new Error('El IUM y la resolución admiten hasta 100 caracteres.');
  const vital = producto.tipoProductoCode === 4;
  if (vital && !ium && !numeroResolucion)
    throw new Error('El vital no disponible requiere código IUM o número de resolución.');
  if (vital && motivos.length)
    throw new Error('El rechazo por CUM o INVIMA no aplica al vital no disponible.');
  const muestreo = calcularMuestreo(cantidadFisica, producto.cantidadErrores);
  const cumple =
    cantidadFisica > 0 &&
    muestreo.cumple &&
    producto.estadoEmbalajeCode !== 2 &&
    motivos.length === 0 &&
    producto.reviEtiquetaProducto &&
    producto.reviOrtografiaSellos &&
    (vital || (producto.verifiRegSanINVIMA && producto.correspFabriExpediSani));
  const inspeccion: InspeccionGuardada = {
    versionEsquema: 1,
    cantidadFacturada: entrada.cantidadFacturada,
    cantidadFisica,
    novedades,
    motivosRechazo: [...motivos],
    ium: vital ? ium : '',
    numeroResolucion: vital ? numeroResolucion : '',
    actualizadoPor: usuario,
    actualizadoEn: new Date().toISOString(),
  };
  return { inspeccion, muestreo, cumple: !!cumple };
}
