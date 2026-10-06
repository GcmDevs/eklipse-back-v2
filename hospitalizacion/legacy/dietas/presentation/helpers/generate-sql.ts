/** @deprecated */
export const generateInsertSql = (data: any[], table: string, values: string[], keys: string[]) => {
  let entities = '';

  data.forEach((_, di) => {
    let element = '(';

    keys.forEach((key, ki) => {
      const value = typeof _[key] === 'number' ? _[key] : `'${_[key]}'`;
      element += `${value}${ki === keys.length - 1 ? ')' : ','}`;
    });

    element += `${di === data.length - 1 ? ';' : ','}`;

    entities += element;
  });

  let base = `INSERT INTO ${table} (${values}) VALUES ${entities}`;

  return base;
};
