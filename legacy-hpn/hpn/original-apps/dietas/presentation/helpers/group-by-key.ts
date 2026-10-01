import { cloneDeep } from 'lodash';

export interface Grouped<T> {
  key: string | number | Date;
  name: string | number | Date;
  rows: T[];
}

export interface TakGrouped<T> {
  key: any;
  name: any;
  rows: T[];
}

export function groupByKeyExtend<T>(options: {
  data: Array<T>;
  colWithKey: string;
  colWithName?: string;
  colNameFromType?: boolean;
  colNamePropertyOnTypeWithName?: string;
}) {
  if (!options.colNamePropertyOnTypeWithName) options.colNamePropertyOnTypeWithName = 'forHumans';

  const newArray: TakGrouped<T>[] = [];
  const dataFrezzed = Object.freeze(options.data);

  dataFrezzed.forEach(el => {
    const tempArray = newArray.filter(j => j.key === el[options.colWithKey]);
    if (tempArray.length) newArray[newArray.indexOf(tempArray[0])].rows.push(el);
    else {
      const name = !options.colNameFromType
        ? el[options.colWithName || options.colWithKey]
        : el[options.colWithName][options.colNamePropertyOnTypeWithName];

      newArray.push({
        key: el[options.colWithKey] as string,
        name,
        rows: [el],
      });
    }
  });

  return newArray;
}

export function groupByKey<T>(data: Array<T>, columnWithKey: string, columnWithName?: string) {
  const newArray: TakGrouped<T>[] = [];

  const dataFrezzed = Object.freeze(cloneDeep(data));

  dataFrezzed.forEach(_ => {
    const tempArray = newArray.filter(j => j.key === (_ as any)[columnWithKey]);
    if (tempArray.length > 0) {
      newArray[newArray.indexOf(tempArray[0])].rows.push(_);
    } else {
      newArray.push({
        key: (_ as any)[columnWithKey] as string,
        name: (_ as any)[columnWithName || columnWithKey] as string,
        rows: [_],
      });
    }
  });

  return newArray;
}
