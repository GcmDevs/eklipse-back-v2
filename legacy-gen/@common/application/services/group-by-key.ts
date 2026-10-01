import { cloneDeep } from 'lodash';

export interface GcmGrouped<T> {
  key: any;
  name: any;
  rows: T[];
}

export function groupByKey<T>(data: Array<T>, columnWithKey: string, columnWithName?: string) {
  const newArray: GcmGrouped<T>[] = [];

  const dataFrezzed = Object.freeze(cloneDeep(data));

  dataFrezzed.forEach(e => {
    const tempArray = newArray.filter(j => j.key === (e as any)[columnWithKey]);
    if (tempArray.length > 0) {
      newArray[newArray.indexOf(tempArray[0])].rows.push(e);
    } else {
      newArray.push({
        key: (e as any)[columnWithKey] as string,
        name: (e as any)[columnWithName || columnWithKey] as string,
        rows: [e],
      });
    }
  });

  return newArray;
}
