import { EpicrisisDto } from '@hcn/ori/epi/application/data-transfers';
import { EpicrisisResponse } from '../data-transfers';

export const castDataToEpicrisisConfirmadaDto = (_: EpicrisisResponse): EpicrisisDto => {
  return {
    consecutivo: _.HCECONSEC,
    ingreso: {
      consecutivo: _.AINCONSEC,
    },
    createdAt: _.HCEFECDOC,
    paciente: {
      nombreCompleto: _.GPANOMCOM,
      numeroDocumento: _.PACNUMDOC,
      lugarExpedDocumento: _.PACEXPEDI,
    },
    medico: {
      nombreCompleto: _.GMENOMCOM,
    },
    estado: {
      code: _.HCEESTDOC,
      forHumans: _.HCEESTDOC ? 'CONFIRMADA' : 'DESCONFIRMADA',
    },
  };
};
