export const formatMoney = (number: number, round = true): string => {
  if (typeof number === 'number') {
    const numberFt = round ? Math.ceil(number) : number;
    return Intl.NumberFormat('en-US').format(numberFt);
  } else {
    return number;
  }
};
