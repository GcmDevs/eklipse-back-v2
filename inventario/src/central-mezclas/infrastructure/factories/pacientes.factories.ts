import { CtMzPacienteRes } from '@inn/central-mezclas/application/responses';
import { PacienteOrm } from '@inn/orm/gen';

export const dataToPacienteRes = (usuario: PacienteOrm): CtMzPacienteRes => {
  const cama = usuario.ingresos?.[0]?.estancias?.[0]?.cama;
  return {
    id: usuario.id,
    cedula: usuario.numDoc,
    nombreCompleto: usuario.nombreCompleto,
    fechaNacimiento: usuario.fechaNacimiento,
    cama: cama ? { id: cama.id, codigo: cama.codigo, nombre: cama.nombre } : null,
  };
};
