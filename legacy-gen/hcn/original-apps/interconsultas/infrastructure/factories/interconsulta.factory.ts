import { InterConsultaPendienteDto } from '@hcn/ori/intc/application/data-transfers';
import { InterConsultaPendienteResponse } from '../data-transfers';

export const dataToEpicrisisPendienteDto = (
  _: InterConsultaPendienteResponse
): InterConsultaPendienteDto => {
  return {
    id: _.HCNINTERC,
    centro: {
      id: _.ADNCENATE,
      nombre: _.ACANOMBRE,
    },
    ingreso: {
      id: _.ADNINGRESO,
      consecutivo: _.AINCONSEC,
    },
    especialidad: {
      id: _.GENESPECI,
      nombre: _.GEEDESCRI,
    },
    folio: {
      id: _.HCNFOLIO,
      createdAt: new Date(_.HCNFECFOL),
    },
    paciente: {
      id: _.GENPACIEN,
      nombreCompleto: _.PACNOMBRE,
      numeroDocumento: _.PACDOCUME,
      genero: {
        type: _.GPASEXPAC,
        forHumans: _.GPASEXPAC === 1 ? 'MASCULINO' : 'FEMENINO',
      },
    },
    cama: {
      codigo: _.HCACODIGO,
      nombre: _.HCANOMBRE,
      subgrupo: {
        codigo: _.HSUCODIGO,
        nombre: _.HSUNOMBRE,
      },
    },
    diagnostico: {
      codigo: _.DIACODIGO,
      nombre: _.DIANOMBRE,
    },
    motivoConsulta: _.HCIMOTIVO,
  };
};
