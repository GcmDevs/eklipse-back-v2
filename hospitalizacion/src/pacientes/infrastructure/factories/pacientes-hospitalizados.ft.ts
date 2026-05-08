import { tipoDocumentoTypeFactory } from '@ctypes/gen/pacientes';
import { PacienteHospitalizadoRes } from '@hpn/pacientes/application/responses';
import { EstanciaOrm } from '@orm/hpn';

export const dataToPacienteHospitalizadoRes = (el: EstanciaOrm): PacienteHospitalizadoRes => {
  return {
    nombreCompleto: el.ingreso.paciente.nombreCompleto,
    documento: {
      numero: el.ingreso.paciente.numeroDoc,
      tipo: tipoDocumentoTypeFactory(el.ingreso.paciente.tipoDocCode).getForHumans(),
    },
    fechaNacimiento: el.ingreso.paciente.fechaNacimiento,
    fechaIngreso: el.ingreso.fechaIngreso,
    eps: {
      nombre: el.ingreso.detalleContrato.nombre,
    },
    ubicacion: {
      subgrupo: { codigo: el.cama.subgrupo.codigo, nombre: el.cama.subgrupo.nombre },
      cama: { codigo: el.cama.codigo, nombre: el.cama.nombre },
    },
  };
};
