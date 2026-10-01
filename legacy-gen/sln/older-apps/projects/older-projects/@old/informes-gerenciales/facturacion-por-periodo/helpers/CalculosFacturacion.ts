export const Deficit = (meta: any, resumenConstant: any): number => {
  return meta.META - resumenConstant;
};

export const Cumplimiento = (meta: any, facturadoPeriodo: any): number => {
  return (facturadoPeriodo / meta.META) * 100;
};

export const FacturadoPGP = (resumen: any, resumenConstant: any): number => {
  const porcentaje = resumen.REGISTROPGP / resumenConstant.REGISTROPGP;
  return resumenConstant.FACTURADOPGP * porcentaje;
};

export const FacturadoSubtotal = (resumen: any, facturadoPgp: any): number => {
  return resumen.FACTURADOEVENTO + facturadoPgp;
};

export const FacturadoPeriodo = (FacturadoSubtotal: any, resumen: any): number => {
  return FacturadoSubtotal - resumen.TOTALREFACTURADA;
};

export const DeficitPGP = (facturadoPgp: any, resumen: any): number => {
  return facturadoPgp - resumen.REGISTROPGP;
};
