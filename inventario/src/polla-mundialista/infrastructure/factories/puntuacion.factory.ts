export const calcularPuntosPronostico = (
  localMarcador: number,
  visitanteMarcador: number,
  localPrediccion: number,
  visitantePrediccion: number,
  exactos = false,
  aciertos = false,
  pendientes = false
): number => {
  if (!pendientes && !localMarcador && !visitanteMarcador) return 0;

  if (pendientes && !localMarcador && !visitanteMarcador) return 1;

  if (localMarcador === localPrediccion && visitanteMarcador === visitantePrediccion) {
    return pendientes ? 0 : exactos ? 1 : aciertos ? 0 : 5;
  }

  const diferenciaMarcador = Math.abs(localMarcador - visitanteMarcador);
  const diferenciaPrediccion = Math.abs(localPrediccion - visitantePrediccion);

  const ganadorMarcador =
    localMarcador > visitanteMarcador
      ? 'local'
      : visitanteMarcador > localMarcador
        ? 'visitante'
        : 'empate';

  const pronosticoGanador =
    localPrediccion > visitantePrediccion
      ? 'local'
      : visitantePrediccion > localPrediccion
        ? 'visitante'
        : 'empate';

  if (
    diferenciaMarcador === diferenciaPrediccion &&
    ganadorMarcador === pronosticoGanador &&
    ganadorMarcador !== 'empate' &&
    pronosticoGanador !== 'empate'
  ) {
    return pendientes ? 0 : exactos ? 0 : aciertos ? 1 : 3;
  }

  if (ganadorMarcador === pronosticoGanador) {
    return pendientes ? 0 : exactos ? 0 : aciertos ? 1 : 2;
  }

  return 0;
};
