import { CtmType } from '@common/domain/types';

export type AgruEstanProloIpsCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class AgruEstanProloIpsType extends CtmType<AgruEstanProloIpsCode> {
  constructor(
    code: AgruEstanProloIpsCode,
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

const INOPORTUNIDAD_IC = new AgruEstanProloIpsType(11, 'INOPORTUNIDAD DE IC', []);
const CIRUGIA = new AgruEstanProloIpsType(6, 'CIRUGIA', []);
const NO_DISPO_MED_MAT_INS = new AgruEstanProloIpsType(8, 'NO DISPONIBILIDAD MED-MAT-INS', []);
const DEMORA_MEDIOS_DIAGNOSTICOS = new AgruEstanProloIpsType(
  2,
  'DEMORAS EN MEDIOS DIAGNOSTICOS',
  []
);
const ESTANCIA_NO_PROLONGADA = new AgruEstanProloIpsType(3, 'ESTANCIA NO PROLONGADA', []);
const JUNTA_MEDICO_QX = new AgruEstanProloIpsType(5, 'JUNTA MEDICO QX', []);
const CONDICION_MEDICA = new AgruEstanProloIpsType(9, 'CONDICION MEDICA', []);
const ISO = new AgruEstanProloIpsType(1, 'ISO', []);
const IAAS = new AgruEstanProloIpsType(4, 'IAAS', []);
const INTERCONSULTAS = new AgruEstanProloIpsType(7, 'INTERCONSULTAS', []);
const VALORACION_SEGUIMIENTOS = new AgruEstanProloIpsType(10, 'VALORACION DE SEGUIMIENTOS', []);

export const agruEstanProlIpsTypeFactory = (code: AgruEstanProloIpsCode) => {
  switch (code) {
    case 1:
      return ISO;
    case 2:
      return DEMORA_MEDIOS_DIAGNOSTICOS;
    case 3:
      return ESTANCIA_NO_PROLONGADA;
    case 4:
      return IAAS;
    case 5:
      return JUNTA_MEDICO_QX;
    case 6:
      return CIRUGIA;
    case 7:
      return INTERCONSULTAS;
    case 8:
      return NO_DISPO_MED_MAT_INS;
    case 9:
      return CONDICION_MEDICA;
    case 10:
      return VALORACION_SEGUIMIENTOS;
    case 11:
      INOPORTUNIDAD_IC;
  }
};

export const AGRU_ESTANCIAS_PROLONGADAS_IPS = {
  ISO,
  DEMORA_MEDIOS_DIAGNOSTICOS,
  ESTANCIA_NO_PROLONGADA,
  IAAS,
  JUNTA_MEDICO_QX,
  CIRUGIA,
  INTERCONSULTAS,
  NO_DISPO_MED_MAT_INS,
  CONDICION_MEDICA,
  VALORACION_SEGUIMIENTOS,
  INOPORTUNIDAD_IC,
};

export const AGRU_ESTANCIA_PROLONGADA_IPS_VALUES = [
  CIRUGIA,
  CONDICION_MEDICA,
  DEMORA_MEDIOS_DIAGNOSTICOS,
  ESTANCIA_NO_PROLONGADA,
  IAAS,
  INTERCONSULTAS,
  ISO,
  JUNTA_MEDICO_QX,
  NO_DISPO_MED_MAT_INS,
  VALORACION_SEGUIMIENTOS,
  INOPORTUNIDAD_IC,
];
