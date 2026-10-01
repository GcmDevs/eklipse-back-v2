import { EstanciaOrm } from '@inn/orm/hpn';
import { SuministroPacienteOrm } from '@orm/inn/documentos';

export const dataToFetchRes = (estancia: EstanciaOrm, documentos: SuministroPacienteOrm[]) => {
  return {
    ultimaEstancia: {
      id: estancia.id,
      fechaIngreso: estancia.fechaIngreso,
      cama: {
        id: estancia.cama.id,
        codigo: estancia.cama.codigo,
        descripcion: estancia.cama.nombre,
        subgrupo: {
          id: estancia.cama.subgrupo.id,
          codigo: estancia.cama.subgrupo.codigo,
          nombre: estancia.cama.subgrupo.nombre,
        },
      },
      ingreso: {
        consecutivo: estancia.ingreso.consecutivo,
        paciente: {
          id: estancia.ingreso.paciente.id,
          nombreCompleto: estancia.ingreso.paciente.nombreCompleto,
          numeroDocumento: estancia.ingreso.paciente.numDoc,
          fechaNacimiento: estancia.ingreso.paciente.fechaNacimiento,
        },
      },
    },
    documentos: documentos.map(os => {
      return {
        id: os.documento.id,
        consecutivo: os.documento.consecutivo,
        fechaCreacion: os.documento.fechaCreacion,
        fechaConfirmacion: os.documento.fechaConfirmacion,
        isListoParaEntrega: os.isListoParaEntrega,
        creadoPor: {
          nombreCompleto: os.documento.creadoPor.nombreCompleto.trim(),
          numeroDocumento: os.documento.creadoPor.cedula,
        },
        ordenSuministro: {
          id: os.id,
          suministros: os.detalle.map(d => {
            return {
              id: d.id,
              cantidad: d.cantidad,
              cantidadAplicada: d.cantidadAplicada,
              cantidadDevuelta: d.cantidadDevuelta,
              cantidadPendiente: d.cantidadPendiente,
              cantidadRecibida: d.cantidadRecibida,
              costoTotal: d.precio * d.cantidad,
              costoUnitario: d.precio,
              producto: {
                id: d.producto.id,
                codigo: d.producto.codigo,
                descripcionCorta: d.producto.descripcion,
              },
            };
          }),
        },
      };
    }),
  };
};
