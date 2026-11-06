const enumToString = (object: object) => {
  return Object.keys(object)
    .map(key => object[key])
    .filter(value => typeof value === 'string') as string[];
};

export const castDataServices = {
  enumToString,
};
