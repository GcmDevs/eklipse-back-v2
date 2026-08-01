import { PacienteRes } from '@hpn/formato-anatomopatologicos/application/responses';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancias-prolongadas';

export const dataToPacienteRes = (paciente: CensoEstanciaProlongadaOrm): PacienteRes => {
  const pacienteNuevo: PacienteRes = {
    sede: paciente.sede,
    especialidad: paciente.especialidad,
    fecha: paciente.fecha.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    identificacion: paciente.identificacion,
    nombrePaciente: paciente.nombrePaciente,
    ingreso: paciente.ingreso,
    grupoNuevo: paciente.grupoNuevo,
    planBeneficio: paciente.planBeneficio,
    entidad: paciente.entidad,
    municipio: paciente.municipio,
    diagnostico: paciente.diagnostico,
  };

  return pacienteNuevo;
};
export const dataToPacientesRes = (pacientes: CensoEstanciaProlongadaOrm[]): PacienteRes[] => {
  let pacientesMap = [];
  pacientes.map(paciente => {
    const pacienteNuevo: PacienteRes = {
      sede: paciente.sede,
      especialidad: paciente.especialidad,
      fecha: paciente.fecha.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      identificacion: paciente.identificacion,
      nombrePaciente: paciente.nombrePaciente,
      ingreso: paciente.ingreso,
      grupoNuevo: paciente.grupoNuevo,
      planBeneficio: paciente.planBeneficio,
      entidad: paciente.entidad,
      municipio: paciente.municipio,
      diagnostico: paciente.diagnostico,
    };
    pacientesMap.push(pacienteNuevo);
  });

  return pacientesMap;
};
