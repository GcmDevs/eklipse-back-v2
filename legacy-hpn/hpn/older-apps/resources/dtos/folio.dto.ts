export interface FolioDto {
  folio: {
    id: number;
    creadoDesde: Date;
  };
  diagnostico: {
    codigo: string;
    nombre: string;
    isPrincipal: boolean;
    observaciones: string;
  };
  medico: {
    nombreCompleto: string;
    documento: string;
  };
}

export interface FolioResponse {
  OID: number;
  HCFECFOL: Date;
  DIACODIGO: string;
  DIANOMBRE: string;
  HCPDIAPRIN: true;
  observaciones: string;
  USUNOMBRE: string;
  USUDESCRI: string;
}

export const dataToFolioDto = (_: FolioResponse): FolioDto => {
  return {
    folio: {
      id: _.OID,
      creadoDesde: new Date(_.HCFECFOL),
    },
    diagnostico: {
      codigo: _.DIACODIGO.trim(),
      nombre: _.DIANOMBRE.trim(),
      isPrincipal: _.HCPDIAPRIN,
      observaciones: _.observaciones.trim(),
    },

    medico: {
      nombreCompleto: _.USUNOMBRE.trim(),
      documento: _.USUDESCRI.trim(),
    },
  };
};
