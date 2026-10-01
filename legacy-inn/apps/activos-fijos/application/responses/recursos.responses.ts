import { EntidadBasicaRes } from '@common/application/responses';

export class AfnActivoRec extends EntidadBasicaRes {
  placa: string;
  numeroSerie: string;
  responsable: EntidadBasicaRes;
}

export class afnInfoPacienteRes {
  ingreso: number;
  nombre: string;
  paciente: {
    documento: string;
    nombre: string;
  };
  planBeneficio: EntidadBasicaRes;
  tercero: EntidadBasicaRes;
}
