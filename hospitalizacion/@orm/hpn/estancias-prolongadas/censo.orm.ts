import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({ name: 'EKVIEWCENSO' })
export class CensoEstanciaProlongadaOrm {
  @ViewColumn({ name: 'sede' })
  sede: string;

  @ViewColumn({ name: 'hsunombre' })
  hsuNombre: string;

  @ViewColumn({ name: 'gasnombre' })
  gasNombre: string;

  @ViewColumn({ name: 'cama' })
  cama: string;

  @ViewColumn({ name: 'TIPO_INGRESO' })
  tipoIngreso: string;

  @ViewColumn({ name: 'ESP_ESPECIALIDAD_1' })
  especialidad: string;

  @ViewColumn({ name: 'fecha' })
  fecha: Date;

  @ViewColumn({ name: 'identificacion' })
  identificacion: string;

  @ViewColumn({ name: 'NOMBRE DEL PACIENTE' })
  nombrePaciente: string;

  @ViewColumn({ name: 'INGRESO' })
  ingreso: number;

  @ViewColumn({ name: 'Grupo_nuevo' })
  grupoNuevo: string;

  @ViewColumn({ name: 'edad' })
  edad: number;

  @ViewColumn({ name: 'sexo' })
  sexo: string;

  @ViewColumn({ name: 'dias' })
  dias: number;

  @ViewColumn({ name: 'plan_beneficio' })
  planBeneficio: string;

  @ViewColumn({ name: 'entidad' })
  entidad: string;

  @ViewColumn({ name: 'municipio' })
  municipio: string;

  @ViewColumn({ name: 'hgrnombre' })
  hgrNombre: string;

  @ViewColumn({ name: 'dx_diagnostico_1' })
  diagnostico: string;
}
