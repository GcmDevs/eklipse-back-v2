import {
  CensoRotuloMedicamentoRes,
  MedicamentoRotuloRes,
  RegistrarRotuloMedicamentoRes,
  RotuloMedicamentoRes,
} from '@hpn/rotulo-medicamentos/application/responses';
import { CensoEstanciaProlongadaOrm } from '@orm/hpn/estancias-prolongadas';
import { RotuloMedicamentoOrm } from '../orm/rotulo-medicamentos';

export const dataToRotuloMedicamentoRes = (rotulo: RotuloMedicamentoOrm): RotuloMedicamentoRes => {
  return {
    id: rotulo.id,
    nombrePaciente: rotulo.paciente.nombreCompleto,
    numeroDocumento: rotulo.paciente.numeroDoc,
    codigoProducto: rotulo.producto.codigo,
    descripcionProducto: rotulo.producto.descripcionCorta,
    fechaRotulo: rotulo.fechaRotulo,
    cama: rotulo.cama,
    servicio: rotulo.servicio,
    dosis: rotulo.dosis,
    unidadMedida: rotulo.unidadMedida,
    viaAdministracion: rotulo.viaAdministracion,
    inicio: rotulo.inicio,
    usuario: rotulo.usuario.nombreCompleto,
    ingresoConsecutivo: rotulo.ingreso.consecutivo,
  };
};

export const dataToRegistrarRotuloMedicamentoRes = (
  rotulo: RotuloMedicamentoOrm
): RegistrarRotuloMedicamentoRes => {
  return {
    id: rotulo.id,
    ingresoId: rotulo.ingresoId,
    usuarioId: rotulo.usuarioId,
    pacienteId: rotulo.pacienteId,
    productoId: rotulo.productoId,
    cama: rotulo.cama,
    fechaRotulo: rotulo.fechaRotulo,
    servicio: rotulo.servicio,
    dosis: rotulo.dosis,
    viaAdministracion: rotulo.viaAdministracion,
    inicio: rotulo.inicio,
    unidadMedida: rotulo.unidadMedida,
    createdAt: rotulo.createdAt,
    updatedAt: rotulo.updatedAt,
    cantidad: rotulo.cantidad,
    guardado: rotulo.guardado,
    administrado: rotulo.guardado,
  };
};

export const dataToCensoRotuloMedicamentoRes = (
  censo: CensoEstanciaProlongadaOrm
): CensoRotuloMedicamentoRes => {
  return {
    sede: censo.sede,
    hsuNombre: censo.hsuNombre,
    gasNombre: censo.gasNombre,
    cama: censo.cama,
    tipoIngreso: censo.tipoIngreso,
    especialidad: censo.especialidad,
    fecha: censo.fecha,
    identificacion: censo.identificacion,
    nombrePaciente: censo.nombrePaciente,
    ingreso: censo.ingreso,
    grupoNuevo: censo.grupoNuevo,
    edad: censo.edad,
    sexo: censo.sexo,
    dias: censo.dias,
    planBeneficio: censo.planBeneficio,
    entidad: censo.entidad,
    municipio: censo.municipio,
    hgrNombre: censo.hgrNombre,
    diagnostico: censo.diagnostico,
  };
};

export const dataToMedicamentoRotuloRes = (medicamento: any): MedicamentoRotuloRes => {
  return {
    id: medicamento.ID,
    ingreso: medicamento.INGRESO,
    folio: medicamento.FOLIO,
    codigo: medicamento.CODIGO,
    descripcion: medicamento.DESCRIPCION,
    cantidad: medicamento.CANTIDAD,
    administrado: Boolean(medicamento.ADMINISTRADO),
    guardado: Boolean(medicamento.GUARDADO),
    codigo_estado: medicamento.CODIGO_ESTADO,
    estado: medicamento.ESTADO,
  };
};
