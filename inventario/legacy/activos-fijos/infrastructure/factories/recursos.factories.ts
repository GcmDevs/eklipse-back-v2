import { AfnActivoRec, afnInfoPacienteRes } from '@inn/lgc/afn/application/responses';
import { ActivoOrm } from '@inn/lgc/afn/orm/inn/activos-fijos';
import { IngresoOrm } from '@inn/lgc/afn/orm/gen';
import { EntidadBasicaRes } from '@common/infrastructure/responses';

export const afnActivoOrmToAfnActivoRecFactory = (data: ActivoOrm) => {
  const e = new AfnActivoRec();
  e.id = data.id;
  e.codigo = data.codigo;
  e.placa = data.placa;
  if (data.producto) {
    e.nombre = data.producto.descripcion;
  }
  if (data.informacionAdicional) {
    e.numeroSerie = data.informacionAdicional.numeroSerie;
  }
  if (data.responsable) {
    e.responsable = new EntidadBasicaRes();
    e.responsable.id = data.responsable.id;
    e.responsable.codigo = data.responsable.codigo;
    e.responsable.nombre = data.responsable.nombre;
  }
  return e;
};

export const afnIngresoOrmToAfnInfoPacienteFactory = (data: IngresoOrm) => {
  const p = new afnInfoPacienteRes();
  p.ingreso = data.id;
  p.paciente = {
    documento: data.paciente.numDoc,
    nombre: data.paciente.nombreCompleto,
  };
  p.nombre = p.paciente.nombre;
  p.planBeneficio = new EntidadBasicaRes();
  p.planBeneficio.id = data.contrato.id;
  p.planBeneficio.codigo = data.contrato.codigo;
  p.planBeneficio.nombre = data.contrato.nombre;
  p.tercero = new EntidadBasicaRes();
  p.tercero.id = data.contrato.terceroId;
  p.tercero.codigo = data.contrato.tercero.numeroDocumento;
  p.tercero.nombre = data.contrato.tercero.nombreCompleto;
  return p;
};
