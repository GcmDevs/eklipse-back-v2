export type TransactionDietaTypeCode = 1 | 2 | 3 | 4;

export class TransactionDietaType {
  constructor(private code: TransactionDietaTypeCode, private forHumans: string) {}

  public getCode(): TransactionDietaTypeCode {
    return this.code;
  }

  public getForHumans(): string {
    return this.forHumans;
  }
}

export const SOLICI_SUBGRU = new TransactionDietaType(1, 'REGISTRO DIETAS POR SUBGRUPO');
export const MODIFI_INDIV = new TransactionDietaType(2, 'MODIFICACIÓN DIETA INDIVIDUAL');
export const CANCEL_INDIV = new TransactionDietaType(3, 'CANCELACIÓN DIETA INDIVIDUAL');
export const MODIFI_EXTRA = new TransactionDietaType(4, 'MODIFICACIÓN DIETAS EXTRAORDINARIAS');

export function transactionTypeFactory(code: TransactionDietaTypeCode): TransactionDietaType {
  switch (code) {
    case 1:
      return SOLICI_SUBGRU;
    case 2:
      return MODIFI_INDIV;
    case 3:
      return CANCEL_INDIV;
    case 4:
      return MODIFI_EXTRA;
  }
}

export const CONDICIONES_TRANSPORTE_VALUES = [
  SOLICI_SUBGRU,
  MODIFI_INDIV,
  CANCEL_INDIV,
  MODIFI_EXTRA,
];
