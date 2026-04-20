import { EstanciaOrm } from '@inn/orm/hpn';
import { SuministroPacienteOrm } from '@inn/orm/inn/documentos';

export const dataToFetchSumPac = (estancia: EstanciaOrm, documentos: SuministroPacienteOrm[]) => {
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
    documentos: documentos.map(sumPac => {
      return {
        id: sumPac.documento.id,
        consecutivo: sumPac.documento.consecutivo,
        fechaCreacion: sumPac.documento.fechaCreacion,
        fechaConfirmacion: sumPac.documento.fechaConfirmacion,
        isListoParaEntrega: sumPac.isListoParaEntrega,
        creadoPor: {
          nombreCompleto: sumPac.documento.creadoPor.nombreCompleto.trim(),
          numeroDocumento: sumPac.documento.creadoPor.cedula,
        },
        ordenSuministro: {
          id: sumPac.id,
          suministros: sumPac.detalle.map(d => {
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
                descripcionCorta: d.producto.descripcionCorta,
              },
            };
          }),
        },
      };
    }),
  };
};
