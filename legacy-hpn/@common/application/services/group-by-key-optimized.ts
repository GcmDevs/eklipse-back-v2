type KeySelector<T, K extends PropertyKey> = keyof T | ((item: T) => K);

type NameSelector<T> = keyof T | ((item: T) => unknown);

export interface Grouped<K extends PropertyKey, T> {
  key: K;
  name: unknown;
  rows: T[];
}

function resolveSelector<T, R>(item: T, selector: keyof T | ((item: T) => R)): R {
  return typeof selector === 'function'
    ? (selector as (item: T) => R)(item)
    : (item[selector] as unknown as R);
}

export function groupBy<T, K extends PropertyKey = PropertyKey>(
  data: readonly T[],
  keySelector: KeySelector<T, K>,
  nameSelector?: NameSelector<T>
): Grouped<K, T>[] {
  const map = new Map<K, Grouped<K, T>>();

  for (const item of data) {
    const key = resolveSelector<T, K>(item, keySelector);

    let group = map.get(key);

    if (!group) {
      group = {
        key,
        name: nameSelector ? resolveSelector(item, nameSelector) : key,
        rows: [],
      };
      map.set(key, group);
    }

    group.rows.push(item);
  }

  return Array.from(map.values());
}
