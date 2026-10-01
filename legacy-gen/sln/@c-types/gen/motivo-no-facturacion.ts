import { CtmType } from '@common/domain/types';

export type MotivoNoFacturacionCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export class MotivoNoFacturacionType extends CtmType<MotivoNoFacturacionCode> {}

const TODOS = new MotivoNoFacturacionType(0, 'TODOS');
const TIEMPO = new MotivoNoFacturacionType(1, 'TIEMPO');
const MATERIAL_DE_OSTEOSINTESIS = new MotivoNoFacturacionType(
  2,
  'MATERIAL DE OSTEOSINTESIS (MAOS)'
);
const PARAMETRIZACION_CONTRATOS = new MotivoNoFacturacionType(3, 'PARAMETRIZACION CONTRATOS');
const PARAMETRIZACION_SISTEMAS = new MotivoNoFacturacionType(4, 'PARAMETRIZACION SISTEMAS');
const ORDENES_PENDIENTES_DE_PARTE_DE_LOS_SERVICIOS = new MotivoNoFacturacionType(
  5,
  'ORDENES PENDIENTES DE PARTE DE LOS SERVICIOS'
);
const ORDENES_PENDIENTES_DE_FACTURACION = new MotivoNoFacturacionType(
  6,
  'ORDENES PENDIENTES DE FACTURACION'
);
const FURIPS = new MotivoNoFacturacionType(7, 'FURIPS');
const CUENTA_ENVIADA_A_AUDITORIA = new MotivoNoFacturacionType(8, 'CUENTA ENVIADA A AUDITORIA');
const CUENTA_AUDITADA_ENVIADA_A_FACTURACION = new MotivoNoFacturacionType(
  9,
  'CUENTA AUDITADA ENVIADA A FACTURACION'
);

export function MotivoNoFacturacionTypeFactory(
  code: MotivoNoFacturacionCode
): MotivoNoFacturacionType {
  switch (code) {
    case 0:
      return TODOS;
    case 1:
      return TIEMPO;
    case 2:
      return MATERIAL_DE_OSTEOSINTESIS;
    case 4:
      return PARAMETRIZACION_CONTRATOS;
    case 5:
      return PARAMETRIZACION_SISTEMAS;
    case 5:
      return ORDENES_PENDIENTES_DE_PARTE_DE_LOS_SERVICIOS;
    case 6:
      return ORDENES_PENDIENTES_DE_FACTURACION;
    case 7:
      return FURIPS;
    case 8:
      return CUENTA_ENVIADA_A_AUDITORIA;
    case 9:
      return CUENTA_AUDITADA_ENVIADA_A_FACTURACION;
    default:
      throw new Error('Motivo no facturacion no valido');
  }
}

export const MOTIVO_NO_FACTURACION_VALUES = [
  TODOS,
  TIEMPO,
  MATERIAL_DE_OSTEOSINTESIS,
  PARAMETRIZACION_CONTRATOS,
  PARAMETRIZACION_SISTEMAS,
  ORDENES_PENDIENTES_DE_PARTE_DE_LOS_SERVICIOS,
  ORDENES_PENDIENTES_DE_FACTURACION,
  FURIPS,
  CUENTA_ENVIADA_A_AUDITORIA,
  CUENTA_AUDITADA_ENVIADA_A_FACTURACION,
];

export const MOTIVO_NO_FACTURACION = {
  TODOS,
  TIEMPO,
  MATERIAL_DE_OSTEOSINTESIS,
  PARAMETRIZACION_CONTRATOS,
  PARAMETRIZACION_SISTEMAS,
  ORDENES_PENDIENTES_DE_PARTE_DE_LOS_SERVICIOS,
  ORDENES_PENDIENTES_DE_FACTURACION,
  FURIPS,
  CUENTA_ENVIADA_A_AUDITORIA,
  CUENTA_AUDITADA_ENVIADA_A_FACTURACION,
};
