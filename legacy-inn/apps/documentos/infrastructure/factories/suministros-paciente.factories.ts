import { SuministroPacienteOrm } from '@orm/inn/documentos';

export const suministroPacienteOrmToSuministroPacienteRes = (data: SuministroPacienteOrm) => {
  data.ingreso.paciente.setTypes();
  return {
    id: data.id,
    consecutivo: data.documento.consecutivo,
    fechaCreacion: data.documento.fechaCreacion,
    fechaConfirmacion: data.documento.fechaConfirmacion,
    fechaAnulacion: data.documento.fechaAnulacion,
    ingreso: {
      id: data.ingreso.id,
      consecutivo: data.ingreso.consecutivo,
      paciente: {
        id: data.ingreso.paciente.id,
        documento: data.ingreso.paciente.documento,
        nombreCompleto: data.ingreso.paciente.nombreCompleto,
        fechaNacimiento: data.ingreso.paciente.fechaNacimiento,
      },
    },
    detalle: data.detalle.map(dt => {
      return {
        producto: {
          id: dt.producto.id,
          codigo: dt.producto.codigo,
          nombre: dt.producto.descripcion,
        },
        cantidad: dt.cantidad,
        precio: dt.precio,
      };
    }),
  };
};
