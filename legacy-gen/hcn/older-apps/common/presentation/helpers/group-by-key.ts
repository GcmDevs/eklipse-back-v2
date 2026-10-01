/** @deprecated */
export interface GcmGrouped<T> {
  key: any;
  name: any;
  rows: T[];
}

export interface Grouped<T> {
  key: string | number | Date;
  name: string | number | Date;
  rows: T[];
}

/** @deprecated */
export function groupByKey<T>(data: Array<T>, columnWithKey: string, columnWithName?: string) {
  const newArray: GcmGrouped<T>[] = [];

  const dataFrezzed = Object.freeze(data);

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
