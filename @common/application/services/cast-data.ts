function enumToString(object: object) {
  return Object.keys(object)
    .map(key => object[key])
    .filter(value => typeof value === 'string') as string[];
}

function stringArrayForSqlQueries(value: string | string[]): string {
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
}

export function capitalizeFirstLetter(str: string): string {
  if (str) {
    str = str.toLowerCase();
    return str.charAt(0).toUpperCase() + str.slice(1);
  } else {
    return str;
  }
}

export function trim(value: string): string {
  return value.trim();
}

export const castDataServices = {
  enumToString,
  stringArrayForSqlQueries,
  capitalizeFirstLetter,
  trim,
};
