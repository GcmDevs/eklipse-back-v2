import { SolicitudOrm } from '@inn/orm/inn/central-mezclas';
import { UsuarioExternoOrm } from '@inn/orm/gen';
import {
  estadoTypeFactory,
  lineaTypeFactory,
  prioridadTypeFactory,
} from '@inn/types/inn/central-mezclas';
import { PacienteExternoOrm } from '@inn/orm/inn/central-mezclas';
import {
  CtMzNutricionParenteralRes,
  CtMzSeleccionRes,
  CtMzSolicitudRes,
} from '@inn/central-mezclas/application/responses';

export const dataToSolicitudRes = (
  data: SolicitudOrm,
  usuarioExterno: UsuarioExternoOrm,
  pacExt: PacienteExternoOrm
): CtMzSolicitudRes => {
  const nutricionParenteral: CtMzNutricionParenteralRes | undefined = data.nutricionParenteral
    ? {
        aa10Perc: data.nutricionParenteral.aa10Perc,
        aa15Perc: data.nutricionParenteral.aa15Perc,
        aaPed: data.nutricionParenteral.aaPed,
        glutamina: data.nutricionParenteral.glutamina,
        po4: data.nutricionParenteral.po4,
        dad50Perc: data.nutricionParenteral.dad50Perc,
        dad10Perc: data.nutricionParenteral.dad10Perc,
        tabperioK: data.nutricionParenteral.tabperioK,
        tabperioNa: data.nutricionParenteral.tabperioNa,
        tabperioCa: data.nutricionParenteral.tabperioCa,
        tabperioMg: data.nutricionParenteral.tabperioMg,
        etPed: data.nutricionParenteral.etPed,
        etAdu: data.nutricionParenteral.etAdu,
        vhid: data.nutricionParenteral.vhid,
        vipPed: data.nutricionParenteral.vipPed,
        vipAdu: data.nutricionParenteral.vipAdu,
        agua: data.nutricionParenteral.agua,
        lip20Perc: data.nutricionParenteral.lip20Perc,
        pesAjust: data.nutricionParenteral.pesAjust,
        viaCode: data.nutricionParenteral.viaCode,
      }
    : undefined;

  const seleccion: CtMzSeleccionRes[] | undefined =
    data.seleccion && data.seleccion.length
      ? data.seleccion.map(item => {
          const val: CtMzSeleccionRes = {
            nombre: item.medicamento.nombre,
            lineaCode: item.medicamento.lineaCode,
            unidadCode: item.medicamento.unidadCode,
            vehiculoCode: item.vehiculoCode,
            concentracion: item.concentracion,
            volumen: item.volumen,
            cantidad: item.cantidad,
            tiempoAdmin: item.tiempoAdmin,
            uniMedTiempoAdminCode: item.uniMedTiempoAdminCode,
            fechaAplicacion: item.fechaAplicacion,
            viaAdministracionCode: item.viaAdministracionCode,
            laboratorio: item.laboratorio,
            cantidadAdecuar: item.cantidadAdecuar,
            lote: item.lote,
            fechaVencimiento: item.fechaVencimiento,
          };
          return val;
        })
      : undefined;

  return {
    id: data.id,
    fechaCreacion: data.fechaCreacion,
    linea: lineaTypeFactory(data.lineaCode) as any,
    estado: estadoTypeFactory(data.estadoCode) as any,
    prioridad: prioridadTypeFactory(data.prioridadCode) as any,
    usuarioExterno: {
      documento: usuarioExterno.cedula,
      nombreCompleto: usuarioExterno.nombreCompleto,
    },
    usuarioResponsable: data.usuarioResponsable
      ? {
          documento: data.usuarioResponsable.cedula,
          nombreCompleto: data.usuarioResponsable.nombreCompleto,
        }
      : null,
    pacienteExterno: {
      id: pacExt.id,
      nombreCompleto: pacExt.pacienteId ? pacExt.paciente.nombreCompleto : pacExt.nombreCompleto,
      numeroDocumento: pacExt.pacienteId ? pacExt.paciente.numDoc : pacExt.numeroDocumento,
      fechaNacimiento: pacExt.pacienteId
        ? pacExt.paciente.fechaNacimiento.toISOString().split('T')[0]
        : (pacExt.fechaNacimiento as any),
      cama: pacExt.estanciaId ? pacExt.estancia.cama.codigo : pacExt.cama,
    },
    notaRespuesta: data.observacionGestion,
    ...(seleccion && { seleccion }),
    ...(nutricionParenteral && { nutricionParenteral }),
  };
};
