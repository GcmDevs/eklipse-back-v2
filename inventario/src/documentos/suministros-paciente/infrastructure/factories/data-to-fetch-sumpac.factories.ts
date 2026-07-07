import { EstanciaOrm } from '@inn/orm/hpn';
import { SuministroPacienteOrm } from '@inn/orm/inn/documentos';

export const dataToFetchSumPac = (estancia: EstanciaOrm, documentos: SuministroPacienteOrm[]) => {
  return {
    ultimaEstancia: {
      id: estancia.cama ? estancia.id : estancia.ingreso.id,
      fechaIngreso: estancia.cama ? estancia.fechaIngreso : estancia.ingreso.fechaIngreso,
      cama: {
        id: estancia.cama ? estancia.cama.id : 0,
        codigo: estancia.cama ? estancia.cama.codigo : 'SIN ESTANCIA ABIERTA',
        descripcion: estancia.cama ? estancia.cama.nombre : 'SIN ESTANCIA ABIERTA',
        subgrupo: {
          id: estancia.cama ? estancia.cama.subgrupo.id : 0,
          codigo: estancia.cama ? estancia.cama.subgrupo.codigo : 'SIN ESTANCIA ABIERTA',
          nombre: estancia.cama ? estancia.cama.subgrupo.nombre : 'SIN ESTANCIA ABIERTA',
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
        isListoParaEntrega: sumPac.isListoParaEntrega || false,
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
