import { SolicitudOrm } from '@inn/orm/inn/central-mezclas';
import { UsuarioExternoOrm } from '@inn/orm/gen';
import {
  estadoTypeFactory,
  lineaTypeFactory,
  prioridadTypeFactory,
  tiempoAdminTypeFactory,
  unidadTypeFactory,
  vehiculoTypeFactory,
  viaAdministracionTypeFactory,
} from '@inn/types/inn/central-mezclas';
import { PacienteExternoOrm } from '@inn/orm/inn/central-mezclas';
import { CtMzSeleccionRes, CtMzSolicitudRes } from '@inn/central-mezclas/application/responses';

export const dataToSolicitudRes = (
  data: SolicitudOrm,
  usuarioExterno: UsuarioExternoOrm,
  pacExt: PacienteExternoOrm
): CtMzSolicitudRes => {
  return {
    id: data.id,
    fechaCreacion: data.fechaCreacion,
    linea: lineaTypeFactory(data.lineaCode) as any,
    estado: estadoTypeFactory(data.estadoCode) as any,
    prioridad: prioridadTypeFactory(data.prioridadCode) as any,
    usuarioExterno: {
      documento: usuarioExterno.documento,
      nombreCompleto: usuarioExterno.nombreCompleto,
    },
    usuarioResponsable: {
      documento: data.usuarioResponsable.cedula,
      nombreCompleto: data.usuarioResponsable.nombreCompleto,
      observacion: data.usuResObs,
    },
    pacienteExterno: {
      id: pacExt.id,
      nombreCompleto: pacExt.pacienteId ? pacExt.paciente.nombreCompleto : pacExt.nombreCompleto,
      numeroDocumento: pacExt.pacienteId ? pacExt.paciente.numDoc : pacExt.numeroDocumento,
      fechaNacimiento: pacExt.pacienteId
        ? pacExt.paciente.fechaNacimiento.toISOString().split('T')[0]
        : (pacExt.fechaNacimiento as any),
      cama: pacExt.estanciaId ? pacExt.estancia.cama.codigo : pacExt.cama,
    },
    seleccion: data.seleccion.map(item => {
      const val: CtMzSeleccionRes = {
        nombre: item.medicamento.nombre,
        linea: lineaTypeFactory(item.medicamento.lineaCode) as any,
        unidad: unidadTypeFactory(item.unidadCode) as any,
        vehiculo: vehiculoTypeFactory(item.vehiculoCode) as any,
        concentracion: item.concentracion,
        volumen: item.volumen,
        cantidad: item.cantidad,
        tiempoAdmin: item.tiempoAdmin,
        uniMedTiempoAdmin: tiempoAdminTypeFactory(item.uniMedTiempoAdminCode) as any,
        fechaAplicacion: item.fechaAplicacion,
        viaAdministracion: viaAdministracionTypeFactory(item.viaAdministracionCode) as any,
      };
      return val;
    }),
  };
};
