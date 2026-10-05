import { CtmType } from '@common/domain/types';

export type AgruEstanProloErpCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;

export class AgruEstanProloErpType extends CtmType<AgruEstanProloErpCode> {
  constructor(
    code: AgruEstanProloErpCode,
    forHumans: string,
    private items: any[]
  ) {
    super(code, forHumans, null);
  }

  getItems(): any[] {
    return this.items;
  }

  setItems(items: any[]): void {
    this.items = items;
  }
}

const NO_RED_APOYO = new AgruEstanProloErpType(12, 'NO RED DE APOYO', []);
const CONDICION_MEDICA = new AgruEstanProloErpType(1, 'CONDICION MEDICA', []);
const COPAGO = new AgruEstanProloErpType(2, 'INOP COPAGO', []);
const AUT_COTIZACION = new AgruEstanProloErpType(3, 'INOP AUT COTIZACION', []);
const INOP_EGRESO = new AgruEstanProloErpType(20, 'INOP EGRESO', []);
const GENERAR_AUT = new AgruEstanProloErpType(5, 'INOP GENERAR AUT', []);
const AUT_MAOS = new AgruEstanProloErpType(6, 'INOP AUT MAOS', []);
const REMISION = new AgruEstanProloErpType(7, 'INOP REMISION', []);
const UCC = new AgruEstanProloErpType(8, 'INOP UCC', []);
const DESISTIMIENTO_USUARIO = new AgruEstanProloErpType(11, 'DESISTIMIENTO POR EL USUARIO', []);
const ESTANCIA_NO_PROLONGADA = new AgruEstanProloErpType(13, 'ESTANCIA NO PROLONGADA', []);
const RETOMA_UNIDAD_RENAL = new AgruEstanProloErpType(14, 'INOP UNIDAD RENAL', []);
const AUT_AMBULANCIA_AEREA = new AgruEstanProloErpType(15, 'INOP AUT AMBULANCIA AEREA', []);
const AUT_AMBULANCIA_TERRESTRE = new AgruEstanProloErpType(16, 'INOP AUT AMBULANCIA TERRESTRE', []);
const RETOMA_PALIATIVO_AMBULATOR = new AgruEstanProloErpType(
  17,
  'INOP RETOMA PALIATIVO AMBULATORIO',
  []
);
const PLAN_CANGURO_EXTRAHOSP = new AgruEstanProloErpType(19, 'INOP PLAN CANGURO EXTRAHOSP', []);

const IC_TERCERIZADA = new AgruEstanProloErpType(9, 'IC TERCERIZADA', []);
const EGRESO_PADO = new AgruEstanProloErpType(10, 'EGRESO POR PADO', []);
const HOMECARE = new AgruEstanProloErpType(18, 'HOMECARE', []);
const OXIGENO_DOMICILIARIO = new AgruEstanProloErpType(4, 'OXIGENO DOMICILIARIO', []);

export const agruEstanProlErpTypeFactory = (code: AgruEstanProloErpCode) => {
  switch (code) {
    case 1:
      return CONDICION_MEDICA;
    case 2:
      return COPAGO;
    case 3:
      return AUT_COTIZACION;
    case 4:
      return OXIGENO_DOMICILIARIO;
    case 5:
      return GENERAR_AUT;
    case 6:
      return AUT_MAOS;
    case 7:
      return REMISION;
    case 8:
      return UCC;
    case 9:
      return IC_TERCERIZADA;
    case 10:
      return EGRESO_PADO;
    case 11:
      return DESISTIMIENTO_USUARIO;
    case 12:
      return NO_RED_APOYO;
    case 13:
      return ESTANCIA_NO_PROLONGADA;
    case 14:
      return RETOMA_UNIDAD_RENAL;
    case 15:
      return AUT_AMBULANCIA_AEREA;
    case 16:
      return AUT_AMBULANCIA_TERRESTRE;
    case 17:
      return RETOMA_PALIATIVO_AMBULATOR;
    case 18:
      return HOMECARE;
    case 19:
      return PLAN_CANGURO_EXTRAHOSP;
    case 20:
      return INOP_EGRESO;
  }
};

export const AGRU_ESTANCIAS_PROLONGADAS_ERP = {
  CONDICION_MEDICA,
  COPAGO,
  AUT_COTIZACION,
  OXIGENO_DOMICILIARIO,
  GENERAR_AUT,
  AUT_MAOS,
  REMISION,
  UCC,
  IC_TERCERIZADA,
  EGRESO_PADO,
  DESISTIMIENTO_USUARIO,
  NO_RED_APOYO,
  ESTANCIA_NO_PROLONGADA,
  RETOMA_UNIDAD_RENAL,
  AUT_AMBULANCIA_AEREA,
  AUT_AMBULANCIA_TERRESTRE,
  RETOMA_PALIATIVO_AMBULATOR,
  HOMECARE,
  PLAN_CANGURO_EXTRAHOSP,
  INOP_EGRESO,
};

export const AGRU_ESTANCIA_PROLONGADA_ERP_VALUES = [
  AUT_AMBULANCIA_AEREA,
  AUT_AMBULANCIA_TERRESTRE,
  AUT_COTIZACION,
  AUT_MAOS,
  CONDICION_MEDICA,
  COPAGO,
  DESISTIMIENTO_USUARIO,
  EGRESO_PADO,
  ESTANCIA_NO_PROLONGADA,
  GENERAR_AUT,
  HOMECARE,
  IC_TERCERIZADA,
  NO_RED_APOYO,
  OXIGENO_DOMICILIARIO,
  PLAN_CANGURO_EXTRAHOSP,
  REMISION,
  RETOMA_PALIATIVO_AMBULATOR,
  RETOMA_UNIDAD_RENAL,
  UCC,
  INOP_EGRESO,
];
