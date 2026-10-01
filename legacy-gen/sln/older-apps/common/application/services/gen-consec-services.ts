export const generateGenConsec = (preffix: string, numericId: number) => {
  const zeros = 14 - (preffix.length + `${numericId}`.length);
  let zerosConcatenated = '';
  for (let i = 0; i < zeros; i++) zerosConcatenated += '0';
  return `${preffix}${zerosConcatenated}${numericId}`;
};

export const autocompleteGenConsec = (consecutivo: string) => {
  const consecFiltered = consecutivo.replace(/[^ 0-9]/g, '_');
  const consecSplitted = consecFiltered.split('_').filter(el => el);
  const consecNumericId = consecSplitted[consecSplitted.length - 1];

  return generateGenConsec(
    `${consecutivo.replace(consecNumericId, '')}`,
    +consecNumericId
  ).toUpperCase();
};
