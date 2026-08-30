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

export const castDataServices = {
  enumToString,
  stringArrayForSqlQueries,
};
