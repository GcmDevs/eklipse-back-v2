import { tipoDocumentoTypeFactory } from '@ctypes/gen/pacientes';
import { PacienteTrazadorRes } from '@hpn/pacientes/application/responses';
import { PacientePreAltaOrm, PacTrazEncuestaOrm } from '../orm/pacientes-trazadores';
import { pacTrazEncEstadoTypeFactory } from '@hpn/pacientes/domain/types';
import { EstanciaOrm } from '@orm/hpn';
import { UltimoDiagnosticoRes } from '../queries';

export const dataToPacienteTrazadorRes = (data: {
  estancia: EstanciaOrm;
  pacientePreAlta: PacientePreAltaOrm;
  encuesta: PacTrazEncuestaOrm;
  ultimoDiagnostico: UltimoDiagnosticoRes;
}): PacienteTrazadorRes => {
  const { estancia, pacientePreAlta, encuesta, ultimoDiagnostico } = data;

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
    ultimoDiagnosticoPrincipal: !ultimoDiagnostico
      ? null
      : {
          id: ultimoDiagnostico.folioId,
          codigo: ultimoDiagnostico.codigo,
          descripcion: ultimoDiagnostico.descripcion,
          fecha: ultimoDiagnostico.fecha,
          observaciones: ultimoDiagnostico.observaciones,
          medico: {
            documento: ultimoDiagnostico.documentoMedico,
            nombre: ultimoDiagnostico.nombreMedico,
          },
        },
    fechaPrealta: pacientePreAlta.fechaCreacion,
    altaEstimada: `${pacientePreAlta.horaAltaEstimada} HORAS`,
  };
};
