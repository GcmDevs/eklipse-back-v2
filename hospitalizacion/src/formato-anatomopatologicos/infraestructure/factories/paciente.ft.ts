import { PacienteRes } from '@hpn/formato-anatomopatologicos/application/responses';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancias-prolongadas';

export const dataToPacienteRes = (paciente: CensoEstanciaProlongadaOrm): PacienteRes => {
  const pacienteNuevo: PacienteRes = {
    ingreso: paciente.ingreso,
    nombreCompleto: paciente.nombrePaciente,
    numeroDocumento: paciente.identificacion,
    eps: paciente.planBeneficio,
    diagnostico: paciente.diagnostico,
  };

  return pacienteNuevo;
};
export const dataToPacientesRes = (pacientes: CensoEstanciaProlongadaOrm[]): PacienteRes[] => {
  let pacientesMap = [];
  pacientes.map(paciente => {
    const pacienteNuevo: PacienteRes = {
      ingreso: paciente.ingreso,
      nombreCompleto: paciente.nombrePaciente,
      numeroDocumento: paciente.identificacion,
      eps: paciente.planBeneficio,
      diagnostico: paciente.diagnostico,
    };
    pacientesMap.push(pacienteNuevo);
  });

  return pacientesMap;
};
