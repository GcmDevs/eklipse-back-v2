export const isValidDate = (DateStr: string) => {
  const date = new Date(DateStr);
  return !isNaN(date.getTime());
};

export const generateBetweenDates = (start: Date | string, end: Date | string) => {
  let startIsValid = true;
  let endIsValid = true;
  if (typeof start === 'string') startIsValid = isValidDate(start);
  if (typeof end === 'string') endIsValid = isValidDate(end);
  if (!startIsValid) throw new Error('start no es una fecha valida');
  if (!endIsValid) throw new Error('end no es una fecha valida');
  return { start: new Date(`${start}:00:00:00`), end: new Date(`${end}:23:59:59`) };
};
