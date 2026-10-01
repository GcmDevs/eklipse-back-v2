export interface DetalleConteoLike {
  numeroConteo: number;
}

export type MotivoProductoOmitido = 'PRODUCTO_INACTIVO' | 'ESTANTE_INACTIVO' | 'PRODUCTO_ELIMINADO';

export function clasificarProductoOmitido(producto: {
  isActivo: boolean;
  isActivoEstante: boolean;
  isDeleted?: boolean | null;
}): { motivo: MotivoProductoOmitido; mensaje: string } | null {
  if (producto.isDeleted === true) {
    return { motivo: 'PRODUCTO_ELIMINADO', mensaje: 'El producto fue eliminado del estante' };
  }
  if (!producto.isActivoEstante) {
    return { motivo: 'ESTANTE_INACTIVO', mensaje: 'El producto no esta activo en el estante' };
  }
  if (!producto.isActivo) {
    return { motivo: 'PRODUCTO_INACTIVO', mensaje: 'El producto no esta activo para conteo' };
  }
  return null;
}

export function particionarItemsConteo<
  TItem extends { estanteProductoId: number },
  TProducto extends {
    id: number;
    isActivo: boolean;
    isActivoEstante: boolean;
    isDeleted?: boolean | null;
  }
>(items: TItem[], productos: TProducto[]) {
  const productosPorId = new Map(productos.map(producto => [producto.id, producto]));
  const activos: TItem[] = [];
  const omitidos: Array<{
    estanteProductoId: number;
    motivo: MotivoProductoOmitido;
    mensaje: string;
  }> = [];

  for (const item of items) {
    const producto = productosPorId.get(item.estanteProductoId);
    if (!producto) continue;

    const omision = clasificarProductoOmitido(producto);
    if (omision) {
      omitidos.push({ estanteProductoId: item.estanteProductoId, ...omision });
    } else {
      activos.push(item);
    }
  }

  return { activos, omitidos };
}

export function esNumeroConteoAsignable(numeroConteo: number): numeroConteo is 1 | 2 {
  return numeroConteo === 1 || numeroConteo === 2;
}

export function estadoConteoCoincide(
  estado: string | number | null | undefined,
  esperado: number
): boolean {
  return estado !== null && estado !== undefined && Number(estado) === esperado;
}

export interface DetalleConteoRestante {
  numeroConteo: number;
  coincidenciaSistema: boolean;
  cantidadContada: number;
}

export function calcularEstadoTrasRestablecerConteo(detalles: DetalleConteoRestante[]) {
  const ESTADO_AJUSTADO = 2;
  const ESTADO_VERIFICAR = 5;
  const ESTADO_PENDIENTE = 6;
  const ordenados = [...detalles].sort((a, b) => a.numeroConteo - b.numeroConteo);
  const ultimo = ordenados[ordenados.length - 1];
  const conteoCoincidente = [...ordenados].reverse().find(detalle => detalle.coincidenciaSistema);

  return {
    totalConteoRealizado: new Set(ordenados.map(detalle => detalle.numeroConteo)).size,
    numeroConteoCoincidente: conteoCoincidente?.numeroConteo ?? null,
    cantidadOficial:
      ultimo?.numeroConteo === 3 ? Number(ultimo.cantidadContada) : (null as number | null),
    isCerrado: ultimo?.numeroConteo === 3,
    estado: ultimo
      ? ultimo.coincidenciaSistema
        ? ESTADO_AJUSTADO
        : ESTADO_VERIFICAR
      : ESTADO_PENDIENTE,
  };
}

export interface EstadoConteoProducto {
  conteosRealizados: number[];
  siguienteConteoPermitido: number | null;
}

export function construirEstadoConteoProducto(detalles: DetalleConteoLike[]): EstadoConteoProducto {
  const conteosRealizados = [...new Set(detalles.map(d => Number(d.numeroConteo)))]
    .filter(numero => numero >= 1 && numero <= 3)
    .sort((a, b) => a - b);

  const siguienteConteoPermitido = [1, 2, 3].find(numero => !conteosRealizados.includes(numero));

  return {
    conteosRealizados,
    siguienteConteoPermitido: siguienteConteoPermitido ?? null,
  };
}

export type EstadoProductoAsignado = 'PENDIENTE' | 'YA_CONTADO' | 'BLOQUEADO';

export function resolverEstadoProductoAsignado(
  detalles: DetalleConteoLike[],
  numeroConteoActual: number | null,
  estaAjustado: boolean,
  estaCerrado: boolean
): {
  estadoConteoActual: EstadoProductoAsignado;
  requiereConteoActual: boolean;
  conteoRequerido: number | null;
} {
  const estado = construirEstadoConteoProducto(detalles);

  if (
    numeroConteoActual == null ||
    estado.conteosRealizados.includes(numeroConteoActual) ||
    estaAjustado ||
    estaCerrado
  ) {
    return {
      estadoConteoActual: 'YA_CONTADO',
      requiereConteoActual: false,
      conteoRequerido: null,
    };
  }

  if (estado.siguienteConteoPermitido === numeroConteoActual) {
    return {
      estadoConteoActual: 'PENDIENTE',
      requiereConteoActual: true,
      conteoRequerido: numeroConteoActual,
    };
  }

  return {
    estadoConteoActual: 'BLOQUEADO',
    requiereConteoActual: false,
    conteoRequerido: estado.siguienteConteoPermitido,
  };
}

export function conteoCompletadoParaTodos(
  detallesPorProducto: DetalleConteoLike[][],
  numeroConteo: number
): boolean {
  return (
    detallesPorProducto.length > 0 &&
    detallesPorProducto.every(detalles =>
      construirEstadoConteoProducto(detalles).conteosRealizados.includes(numeroConteo)
    )
  );
}

export function vincularDetallesConConteos<
  TConteo extends { id: number },
  TDetalle extends {
    conteoInventarioId: number | undefined;
    conteoInventario: TConteo | undefined;
  }
>(conteos: TConteo[], detalles: TDetalle[]): TDetalle[] {
  if (conteos.length !== detalles.length) {
    throw new Error('La cantidad de conteos y detalles no coincide');
  }

  detalles.forEach((detalle, index) => {
    const conteo = conteos[index];
    if (!conteo?.id) {
      throw new Error('No se puede guardar un detalle sin conteoInventarioId');
    }
    detalle.conteoInventarioId = conteo.id;
    detalle.conteoInventario = conteo;
  });

  return detalles;
}

export interface DistribucionTrasladoInput {
  stockOrigen: number;
  stockDestino: number;
  tipoTraslado: 'COMPLETA' | 'PARCIAL';
  cantidad?: number;
}

export function calcularDistribucionTraslado(input: DistribucionTrasladoInput) {
  const cantidadTransferida =
    input.tipoTraslado === 'COMPLETA' ? input.stockOrigen : Number(input.cantidad);
  const stockOrigen = Number((input.stockOrigen - cantidadTransferida).toFixed(2));
  const stockDestino = Number((input.stockDestino + cantidadTransferida).toFixed(2));

  return {
    cantidadTransferida,
    stockOrigen,
    stockDestino,
    origenAgotado: stockOrigen === 0,
  };
}

export interface EstanteVerificarBase {
  estanteId: number;
  estanteNombre: string;
  productosXVerificar: number;
}

export function construirEstanteVerificar(estante: EstanteVerificarBase) {
  const productoLabel = estante.productosXVerificar === 1 ? 'producto' : 'productos';
  return {
    ...estante,
    estado: 'VERIFICAR' as const,
    requiereAccion: true as const,
    mensaje: `El estante ${estante.estanteNombre} tiene ${estante.productosXVerificar} ${productoLabel} con conteos por verificar.`,
  };
}

export interface EstanteConteosConsolidados {
  estanteId: number;
  estanteNombre: string;
  productos: Array<{ estadoGlobal: number }>;
}

export function construirListaEstantesVerificar(
  estadoVerificar: number,
  estantes: EstanteConteosConsolidados[]
) {
  return estantes.flatMap(estante => {
    const productosXVerificar = estante.productos.filter(
      producto => Number(producto.estadoGlobal) === Number(estadoVerificar)
    ).length;

    if (!productosXVerificar) return [];

    return [
      construirEstanteVerificar({
        estanteId: estante.estanteId,
        estanteNombre: estante.estanteNombre,
        productosXVerificar,
      }),
    ];
  });
}

export interface ConteoVigenteLike {
  createdAt?: Date;
  ciclo?: { estado?: string };
}

export function seleccionarConteoVigente<T extends ConteoVigenteLike>(conteos: T[]): T | null {
  const conteoAbierto = conteos.find(conteo => conteo.ciclo?.estado === 'ABIERTO');
  if (conteoAbierto) return conteoAbierto;

  return (
    [...conteos].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))[0] ??
    null
  );
}

export function filtrarProductosParaConteo<T>(
  productos: T[],
  numeroConteo: number | null,
  esProductoAjustado: (producto: T) => boolean
): T[] {
  if (numeroConteo == null || numeroConteo <= 1) return productos;

  return productos.filter(producto => !esProductoAjustado(producto));
}

export function calcularExistenciaBaseConteo(
  stockEstante: number | null | undefined,
  existenciaGlobal: number
): number {
  return stockEstante !== null && stockEstante !== undefined
    ? Number(stockEstante)
    : Number(existenciaGlobal);
}

interface ProductoConteoCicloLike {
  stock?: number | null;
  producto?: { existencias?: Array<{ cantidad: number }> };
  conteoInventario?: Array<{
    cicloId?: number | null;
    estado?: number;
    detalleConteo?: Array<{ numeroConteo: number; cantidadContada: number }>;
  }>;
}

export function productoEstaAjustadoEnCiclo(
  producto: ProductoConteoCicloLike,
  cicloId: number,
  estadoAjustado: number
): boolean {
  const existenciaGlobal = (producto.producto?.existencias ?? []).reduce(
    (total, existencia) => total + Number(existencia.cantidad),
    0
  );
  const existenciaBase = calcularExistenciaBaseConteo(producto.stock, existenciaGlobal);

  return (producto.conteoInventario ?? [])
    .filter(conteo => conteo.cicloId === cicloId)
    .some(
      conteo =>
        Number(conteo.estado) === Number(estadoAjustado) ||
        (conteo.detalleConteo ?? []).some(
          detalle => Number(detalle.cantidadContada) === existenciaBase
        )
    );
}

export interface ProductoDuplicadoEstanteLike {
  estanteId: number;
  codigoProducto: string;
}

export function agruparProductosDuplicadosPorEstante<T extends ProductoDuplicadoEstanteLike>(
  productos: T[]
) {
  const grupos = new Map<string, T[]>();

  for (const producto of productos) {
    const codigoProducto = producto.codigoProducto?.trim().toUpperCase();
    if (!codigoProducto) continue;

    const clave = `${producto.estanteId}::${codigoProducto}`;
    const grupo = grupos.get(clave) ?? [];
    grupo.push(producto);
    grupos.set(clave, grupo);
  }

  return [...grupos.values()]
    .filter(grupo => grupo.length > 1)
    .map(grupo => ({
      estanteId: grupo[0].estanteId,
      codigoProducto: grupo[0].codigoProducto.trim().toUpperCase(),
      cantidadDuplicados: grupo.length,
      productos: grupo,
    }));
}
