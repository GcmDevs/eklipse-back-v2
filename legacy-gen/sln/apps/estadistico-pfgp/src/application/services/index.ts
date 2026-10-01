const _belongsToActualMonth = (date: Date): boolean => {
  const today = new Date();
  const actualMonth = `${today.getMonth() + 1}-${today.getFullYear()}`;
  const selectedMonth = `${date.getMonth() + 1}-${date.getFullYear()}`;
  if (actualMonth === selectedMonth) return true;
  else return false;
};

const _belongsToPreviousMonth = (date: Date): boolean => {
  const previousDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
  const previosMonth = `${previousDate.getMonth() + 1}-${previousDate.getFullYear()}`;
  const selectedMonth = `${date.getMonth() + 1}-${date.getFullYear()}`;
  if (previosMonth === selectedMonth) return true;
  else return false;
};

export const validacionesMes = (fecha: Date) => {
  const isMesActual = _belongsToActualMonth(fecha);
  const isMesAnterior = _belongsToPreviousMonth(fecha);

  return { isMesActual, isMesAnterior };
};
