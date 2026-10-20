export function capitalizeFirstLetter(str: string): string {
  if (str) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  } else {
    return str;
  }
}

export function toLowerCase(str: string): string {
  if (str) return str.toLowerCase();
  else return str;
}

export function toUpperCase(str: string): string {
  if (str) return str.toUpperCase();
  else return str;
}

export const generarConsecutivo = (
  prefijo: string,
  codigo: number,
  longitud: number = 14
): string => {
  const codigoStr = String(codigo);
  const cerosNecesarios = Math.max(longitud - prefijo.length - codigoStr.length, 0);
  return prefijo + codigoStr.padStart(codigoStr.length + cerosNecesarios, '0');
};

export const stringArrayForSqlQueries = (value: string | string[]): string => {
  let data = '';
  if (typeof value === 'string') {
    data = `'${value}'`;
  } else {
    value.forEach((el, i) => {
      if (!i) data = `'${el}'`;
      else data = `${data}, '${el}'`;
    });
  }

  return data;
};
