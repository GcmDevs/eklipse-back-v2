import { tipoDocumentoTypeFactory } from '@ctypes/gen/pacientes';
import { PacienteTrazadorRes } from '@hpn/pacientes/application/responses';
import { PacientePreAltaOrm, PacTrazEncuestaOrm } from '../orm/pacientes-trazadores';
import { pacTrazEncEstadoTypeFactory } from '@hpn/pacientes/domain/types';
import { EstanciaOrm } from '@orm/hpn';

export const dataToPacienteTrazadorRes = (
  estancia: EstanciaOrm,
  pacientePreAlta: PacientePreAltaOrm,
  encuesta: PacTrazEncuestaOrm
): PacienteTrazadorRes => {
  const estadoCode = !encuesta ? 1 : encuesta.isFinalizada ? 3 : 2;
  return {
    id: estancia.ingreso.paciente.id,
    ingresoId: estancia.ingreso.id,
    nombreCompleto: estancia.ingreso.paciente.nombreCompleto,
    documento: {
      numero: estancia.ingreso.paciente.numeroDoc,
      tipo: tipoDocumentoTypeFactory(estancia.ingreso.paciente.tipoDocCode).getForHumans(),
    },
    fechaNacimiento: estancia.ingreso.paciente.fechaNacimiento,
    fechaIngreso: estancia.ingreso.fechaIngreso,
    eps: {
      nombre: estancia.ingreso.detalleContrato.nombre,
    },
    ubicacion: {
      subgrupo: { codigo: estancia.cama.subgrupo.codigo, nombre: estancia.cama.subgrupo.nombre },
      cama: { codigo: estancia.cama.codigo, nombre: estancia.cama.nombre },
    },
    identificacionPreAlta: pacientePreAlta.observacion,
    estado: pacTrazEncEstadoTypeFactory(estadoCode),
  };
};
