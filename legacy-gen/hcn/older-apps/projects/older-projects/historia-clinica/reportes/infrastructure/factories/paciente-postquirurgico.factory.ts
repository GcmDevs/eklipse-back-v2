import { PacientePostquirurgicoDto } from '@hcn/rft/historia-clinica/reportes/application/dtos';
import { PacientePostquirurgicoResponse } from '../responses';

export const transforPacientePostquirurgicoResponseToDto = (
  _: PacientePostquirurgicoResponse[]
): PacientePostquirurgicoDto[] => {
  return _.map(pacientes => {
    const paciente: any = {};
    paciente.ingreso = { creadoDesde: new Date(pacientes.AINFECING) };
    paciente.folio = {
      id: pacientes.OID,
      creadoDesde: new Date(pacientes.HCFECFOL),
      historiaClinica: {
        descripcionCorta: pacientes.HCCM02N12,
        descripcionLarga: pacientes.HCCM03N13,
      },
    };
    paciente.paciente = { nombreCompleto: pacientes.GPANOMCOM };

    return paciente;
  });
};
