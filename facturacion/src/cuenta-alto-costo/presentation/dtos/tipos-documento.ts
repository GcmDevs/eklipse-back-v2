// PACTIPDOC del ERP -> TIPDOCUSUARIO de CAC. El tipo 0 no identifica un documento CAC.
export const SIGLAS_DOCUMENTO_CAC: Readonly<Record<number, string>> = {
  1: 'CC',
  2: 'CE',
  3: 'TI',
  4: 'RC',
  5: 'PA',
  6: 'AS',
  7: 'MS',
  8: 'NU',
  9: 'SC',
  10: 'CN',
  11: 'CD',
  12: 'PE',
};
